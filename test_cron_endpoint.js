// Script de teste para o endpoint de cron job
// Execute com: node test_cron_endpoint.js

import axios from 'axios';

const BASE_URL = 'https://barber-backend-qlt6.onrender.com'; // Mude para sua URL do Render em produção
const TOKEN = 'trezu_cron_2024_secure'; // Token definido pelo usuário

async function testCronEndpoint() {
  try {
    console.log('🧪 Testando endpoint de cron job...');
    console.log('🔑 Token usado:', TOKEN);
    
    // Teste via query parameter
    const response = await axios.get(`${BASE_URL}/api/cron/decrementar-dias?token=${TOKEN}`);
    
    console.log('✅ Endpoint funcionando!');
    console.log('📊 Resposta:', response.data);
    
    // Verificar estrutura da resposta
    const { message, processed, decremented, timestamp } = response.data;
    
    if (message && typeof processed === 'number' && typeof decremented === 'number') {
      console.log('✅ Estrutura da resposta está correta');
      console.log(`📈 Contas processadas: ${processed}`);
      console.log(`📉 Contas decrementadas: ${decremented}`);
      console.log(`⏰ Timestamp: ${timestamp}`);
    } else {
      console.log('❌ Estrutura da resposta incorreta');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar endpoint:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Dica: Verifique se o token está correto');
    } else if (error.response?.status === 500) {
      console.log('💡 Dica: Verifique se o Firebase está configurado corretamente');
    }
  }
}

async function testUnauthorizedAccess() {
  try {
    console.log('\n🔒 Testando acesso não autorizado...');
    
    const response = await axios.get(`${BASE_URL}/api/cron/decrementar-dias`);
    console.log('❌ Endpoint deveria ter retornado 401');
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Segurança funcionando - acesso negado corretamente');
    } else {
      console.log('❌ Erro inesperado:', error.response?.status);
    }
  }
}

async function runTests() {
  console.log('🚀 Iniciando testes do endpoint de cron job...\n');
  
  await testCronEndpoint();
  await testUnauthorizedAccess();
  
  console.log('\n✨ Testes concluídos!');
}

// Executar testes
runTests().catch(console.error); 