import mysql from 'mysql2/promise';

const dbUrl = process.env.DATABASE_URL;
console.log('Connecting to:', dbUrl.replace(/:[^:]*@/, ':***@'));

const pool = mysql.createPool(dbUrl);

async function checkPasswordHash() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT id, numerica, senha FROM pmam_students WHERE numerica IN (?, ?)',
      ['4122', '4152']
    );
    
    console.log('\nRaw password hashes:');
    rows.forEach(row => {
      console.log(`${row.numerica}: ${row.senha}`);
    });
    
    connection.release();
    pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

checkPasswordHash();
