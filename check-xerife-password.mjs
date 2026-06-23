import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function main() {
  try {
    console.log('Conectando ao banco de dados...');
    const connection = await pool.getConnection();
    console.log('✅ Conectado ao banco de dados');
    
    // Buscar usuário Xerife
    console.log('Buscando usuário...');
    const [rows] = await connection.execute(
      'SELECT id, email, password FROM pmam_users WHERE email = ? LIMIT 1',
      ['socrates.lever@gmail.com']
    );
    console.log('Resultado:', rows);
    
    if (rows.length === 0) {
      console.log('❌ Usuário Xerife não encontrado');
      console.log('Buscando todos os usuários...');
      const [allUsers] = await connection.execute('SELECT id, email, role FROM pmam_users');
      console.log('Usuários encontrados:', allUsers);
      connection.release();
      return;
    }
    
    const user = rows[0];
    console.log('✅ Usuário encontrado:');
    console.log('  ID:', user.id);
    console.log('  Email:', user.email);
    console.log('  Hash:', user.password);
    
    // Testar se a senha 123456 corresponde
    const passwordMatch = await bcrypt.compare('123456', user.password);
    console.log('\n✅ Teste de senha:');
    console.log('  Senha "123456" corresponde?', passwordMatch ? 'SIM ✅' : 'NÃO ❌');
    
    if (!passwordMatch) {
      console.log('\n🔄 Resetando senha para "123456"...');
      const hashedPassword = await bcrypt.hash('123456', 10);
      await connection.execute(
        'UPDATE pmam_users SET password = ? WHERE id = ?',
        [hashedPassword, user.id]
      );
      console.log('✅ Senha resetada com sucesso!');
    }
    
    connection.release();
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

main();
