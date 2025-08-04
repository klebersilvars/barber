import axios from 'axios';

const BASE_URL = 'https://barber-backend-qlt6.onrender.com';
const TOKEN = 'trezu_cron_2024_secure';

async function testEndpoint() {
  try {
    console.log('🧪 Testando endpoint...');
    
    const response = await axios.get(`${BASE_URL}/api/cron/decrementar-dias?token=${TOKEN}`);
    
    console.log('✅ SUCESSO!');
    console.log('📊 Resposta:', response.data);
    
  } catch (error) {
    console.log('❌ ERRO:');
    console.log('Status:', error.response?.status);
    console.log('Mensagem:', error.response?.data || error.message);
  }
}

testEndpoint(); 