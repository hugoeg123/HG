/**
 * Teste de Rate Limiting - Verificação das correções 429
 * 
 * Hook: Testa se as correções de throttling e rate limiting estão funcionando
 * Connector: Usa a API do backend para simular múltiplas requisições
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Simular múltiplas requisições simultâneas
async function testRateLimiting() {
  console.log('🧪 Iniciando teste de rate limiting...');
  
  const promises = [];
  const numRequests = 20; // Número de requisições simultâneas
  
  console.log(`📊 Enviando ${numRequests} requisições simultâneas...`);
  
  for (let i = 0; i < numRequests; i++) {
    const promise = axios.get(`${API_BASE}/health`)
      .then(response => {
        console.log(`✅ Requisição ${i + 1}: ${response.status} - ${response.data.status}`);
        return { success: true, status: response.status, index: i + 1 };
      })
      .catch(error => {
        const status = error.response?.status || 'NETWORK_ERROR';
        console.log(`❌ Requisição ${i + 1}: ${status} - ${error.message}`);
        return { success: false, status, index: i + 1, error: error.message };
      });
    
    promises.push(promise);
  }
  
  console.log('⏳ Aguardando todas as requisições...');
  const results = await Promise.all(promises);
  
  // Analisar resultados
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const rateLimited = results.filter(r => r.status === 429).length;
  
  console.log('\n📈 Resultados do teste:');
  console.log(`✅ Sucessos: ${successful}/${numRequests}`);
  console.log(`❌ Falhas: ${failed}/${numRequests}`);
  console.log(`🚫 Rate Limited (429): ${rateLimited}/${numRequests}`);
  
  if (rateLimited === 0) {
    console.log('🎉 SUCESSO: Nenhum erro 429 detectado!');
  } else {
    console.log('⚠️  ATENÇÃO: Ainda há erros 429 sendo gerados');
  }
  
  return { successful, failed, rateLimited, total: numRequests };
}

// Teste de login múltiplo (mais sensível ao rate limiting)
async function testAuthRateLimiting() {
  console.log('\n🔐 Testando rate limiting de autenticação...');
  
  const loginData = {
    email: 'test@example.com',
    password: 'wrongpassword'
  };
  
  const promises = [];
  const numRequests = 10;
  
  for (let i = 0; i < numRequests; i++) {
    const promise = axios.post(`${API_BASE}/auth/login`, loginData)
      .then(response => {
        console.log(`✅ Login ${i + 1}: ${response.status}`);
        return { success: true, status: response.status, index: i + 1 };
      })
      .catch(error => {
        const status = error.response?.status || 'NETWORK_ERROR';
        console.log(`❌ Login ${i + 1}: ${status}`);
        return { success: false, status, index: i + 1 };
      });
    
    promises.push(promise);
  }
  
  const results = await Promise.all(promises);
  const rateLimited = results.filter(r => r.status === 429).length;
  
  console.log(`🔐 Rate Limited em auth: ${rateLimited}/${numRequests}`);
  
  return rateLimited;
}

// Executar testes
async function runTests() {
  try {
    console.log('🚀 Iniciando bateria de testes de rate limiting\n');
    
    // Teste 1: Requisições gerais
    const generalResults = await testRateLimiting();
    
    // Aguardar um pouco entre testes
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Teste 2: Autenticação
    const authRateLimited = await testAuthRateLimiting();
    
    // Resumo final
    console.log('\n📋 RESUMO FINAL:');
    console.log('================');
    console.log(`Requisições gerais: ${generalResults.successful}/${generalResults.total} sucessos`);
    console.log(`Rate limiting geral: ${generalResults.rateLimited} erros 429`);
    console.log(`Rate limiting auth: ${authRateLimited} erros 429`);
    
    if (generalResults.rateLimited === 0 && authRateLimited === 0) {
      console.log('\n🎉 TODOS OS TESTES PASSARAM! Rate limiting corrigido.');
    } else {
      console.log('\n⚠️  ALGUNS TESTES FALHARAM. Verificar configurações.');
    }
    
  } catch (error) {
    console.error('💥 Erro durante os testes:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runTests();
}

module.exports = { testRateLimiting, testAuthRateLimiting, runTests };