// Teste simples para verificar se o backend está funcionando
import axios from 'axios';

const BASE_URL = 'https://barber-backend-qlt6.onrender.com';

async function testBackend() {
  try {
    console.log('🧪 Testando se o backend está funcionando...');
    
    // Teste básico - qualquer endpoint
    const response = await axios.get(`${BASE_URL}/api/test-decrement`);
    
    console.log('✅ Backend está funcionando!');
    console.log('📊 Resposta:', response.data);
    
  } catch (error) {
    console.error('❌ Erro ao conectar com o backend:', error.response?.status, error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('💡 Backend está rodando mas o endpoint não existe');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 Backend não está rodando');
    }
  }
}

testBackend(); 