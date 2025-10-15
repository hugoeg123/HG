/**
 * Script para testar login do frontend na porta 3000
 * Simula exatamente o que o frontend faz
 */

const axios = require('axios');

// Configuração igual ao frontend
const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

async function testFrontendLogin() {
  console.log('=== TESTE DE LOGIN FRONTEND (PORTA 3000) ===');
  
  try {
    // 1. Testar health check
    console.log('\n1. Testando health check...');
    const healthResponse = await api.get('/health');
    console.log('✅ Health check OK:', healthResponse.status);
    
    // 2. Testar preflight CORS para login
    console.log('\n2. Testando preflight CORS...');
    const preflightResponse = await axios({
      method: 'OPTIONS',
      url: 'http://localhost:5001/api/auth/login',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      }
    });
    console.log('✅ Preflight OK:', preflightResponse.status);
    console.log('CORS Headers:', {
      origin: preflightResponse.headers['access-control-allow-origin'],
      credentials: preflightResponse.headers['access-control-allow-credentials'],
      methods: preflightResponse.headers['access-control-allow-methods']
    });
    
    // 3. Testar login real
    console.log('\n3. Testando login POST...');
    const loginResponse = await axios({
      method: 'POST',
      url: 'http://localhost:5001/api/auth/login',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      },
      data: {
        email: 'hgarib94@gmail.com',
        password: 'extra-300'
      },
      withCredentials: true
    });
    
    console.log('✅ Login OK:', loginResponse.status);
    console.log('Response data:', {
      success: loginResponse.data.success,
      message: loginResponse.data.message,
      hasToken: !!loginResponse.data.token,
      hasUser: !!loginResponse.data.user,
      tokenLength: loginResponse.data.token?.length,
      userEmail: loginResponse.data.user?.email
    });
    
    // 4. Testar requisição autenticada
    if (loginResponse.data.token) {
      console.log('\n4. Testando requisição autenticada...');
      const token = loginResponse.data.token;
      
      const authResponse = await axios({
        method: 'GET',
        url: 'http://localhost:5001/api/auth/me',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Origin': 'http://localhost:3000'
        },
        withCredentials: true
      });
      
      console.log('✅ Auth request OK:', authResponse.status);
      console.log('User data:', {
        id: authResponse.data.user?.id,
        email: authResponse.data.user?.email,
        nome: authResponse.data.user?.nome
      });
    }
    
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ Frontend na porta 3000 pode fazer login com sucesso');
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers
    });
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n🔴 Backend não está rodando na porta 5000');
    } else if (error.response?.status === 0 || error.message.includes('CORS')) {
      console.error('\n🔴 Problema de CORS detectado');
    }
  }
}

testFrontendLogin().catch(console.error);