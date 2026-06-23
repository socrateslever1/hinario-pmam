import fetch from 'node-fetch';

const API_URL = 'https://3000-i9wxqqfgmq0fl21qsamg6-d2deaa80.us2.manus.computer/api/trpc';
const EMAIL = 'socrates.lever@gmail.com';
const PASSWORD = '123456';

async function main() {
  try {
    console.log('🔄 Tentando fazer login com Xerife...');
    
    const response = await fetch(`${API_URL}/auth.loginEmail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: {
          email: EMAIL,
          password: PASSWORD,
        }
      }),
    });
    
    const data = await response.json();
    console.log('Resposta:', JSON.stringify(data, null, 2));
    
    if (data.result?.data?.ok) {
      console.log('✅ Login bem-sucedido!');
      console.log('Usuário:', data.result.data.data);
    } else if (data.error) {
      console.log('❌ Erro no login:', data.error.message);
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

main();
