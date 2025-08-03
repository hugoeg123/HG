/**
 * Script de debug para problemas de login
 * Testa a comunicação entre frontend e backend
 */

const axios = require('axios');

// Configuração similar ao frontend
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dados de teste
const testCredentials = {
  email: 'joao.silva@example.com',
  password: 'senha123'
};

async function testLogin() {
  console.log('=== TESTE DE LOGIN DEBUG ===');
  console.log('URL Base:', api.defaults.baseURL);
  console.log('Credenciais de teste:', testCredentials);
  console.log('');

  try {
    console.log('1. Testando health check...');
    const healthResponse = await api.get('/');
    console.log('✅ Health check OK:', healthResponse.status);
    console.log('');

    console.log('2. Testando requisição OPTIONS (preflight)...');
    const optionsResponse = await axios({
      method: 'OPTIONS',
      url: 'http://localhost:5000/api/auth/login',
      headers: {
        'Origin': 'http://localhost:3002',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    console.log('✅ OPTIONS OK:', optionsResponse.status);
    console.log('CORS Headers:', {
      'Access-Control-Allow-Origin': optionsResponse.headers['access-control-allow-origin'],
      'Access-Control-Allow-Methods': optionsResponse.headers['access-control-allow-methods'],
      'Access-Control-Allow-Headers': optionsResponse.headers['access-control-allow-headers']
    });
    console.log('');

    console.log('3. Testando login POST...');
    const loginResponse = await axios({
      method: 'POST',
      url: 'http://localhost:5000/api/auth/login',
      data: testCredentials,
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3002'
      }
    });
    
    console.log('✅ Login OK:', loginResponse.status);
    console.log('Response data:', {
      hasToken: !!loginResponse.data.token,
      hasUser: !!loginResponse.data.user,
      tokenLength: loginResponse.data.token?.length,
      userEmail: loginResponse.data.user?.email
    });
    console.log('');

    console.log('4. Testando requisição autenticada...');
    const token = loginResponse.data.token;
    const meResponse = await axios({
      method: 'GET',
      url: 'http://localhost:5000/api/auth/me',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Origin': 'http://localhost:3002'
      }
    });
    
    console.log('✅ Auth check OK:', meResponse.status);
    console.log('User data:', meResponse.data.user?.email);
    console.log('');

    console.log('🎉 TODOS OS TESTES PASSARAM!');
    console.log('O problema pode estar na configuração do frontend.');

  } catch (error) {
    console.error('❌ ERRO DETECTADO:');
    console.error('Tipo:', error.constructor.name);
    console.error('Código:', error.code);
    console.error('Mensagem:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('Request feita mas sem resposta');
      console.error('Request:', error.request);
    } else {
      console.error('Erro de configuração:', error.message);
    }
    
    console.error('Config:', {
      url: error.config?.url,
      method: error.config?.method,
      headers: error.config?.headers
    });
  }
}

// Executar teste
testLogin().catch(console.error);