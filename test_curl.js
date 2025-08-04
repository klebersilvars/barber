async function testEndpoint() {
  try {
    console.log('🧪 Testando endpoint...');
    
    const response = await fetch('https://barber-backend-qlt6.onrender.com/api/cron/decrementar-dias?token=trezu_cron_2024_secure');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCESSO!');
      console.log('📊 Resposta:', data);
    } else {
      console.log('❌ ERRO HTTP:', response.status);
      const error = await response.text();
      console.log('Mensagem:', error);
    }
    
  } catch (error) {
    console.log('❌ ERRO DE CONEXÃO:', error.message);
  }
}

testEndpoint(); 