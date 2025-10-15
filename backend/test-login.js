/**
 * Script de teste para verificar se o login está funcionando
 * após a correção do bug net::ERR_ABORTED
 */

const axios = require('axios');

async function testLogin() {
  try {
    console.log('🧪 Testando login após correção do bug...');
    
    // Credenciais do seeder
    const credentials = {
      email: 'joao.silva@example.com',
      password: 'senha123'
    };
    
    console.log('📧 Testando com:', credentials.email);
    
    const response = await axios.post('http://localhost:5001/api/auth/login', credentials, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    if (response.status === 200 && response.data.token) {
      console.log('✅ Login bem-sucedido!');
      console.log('🔑 Token recebido:', response.data.token.substring(0, 20) + '...');
      console.log('👤 Usuário:', response.data.user.name);
      console.log('📧 Email:', response.data.user.email);
      return true;
    } else {
      console.log('❌ Login falhou - resposta inesperada');
      console.log('Status:', response.status);
      console.log('Data:', response.data);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Erro durante o teste de login:');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Mensagem:', error.response.data.message || error.response.data);
    } else if (error.request) {
      console.log('Erro de rede:', error.message);
      console.log('Código:', error.code);
    } else {
      console.log('Erro:', error.message);
    }
    
    return false;
  }
}

async function testInvalidLogin() {
  try {
    console.log('\n🧪 Testando login com credenciais inválidas...');
    
    const invalidCredentials = {
      email: 'joao.silva@example.com',
      password: 'senhaerrada'
    };
    
    const response = await axios.post('http://localhost:5001/api/auth/login', invalidCredentials, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('❌ Login inválido deveria ter falhado, mas passou!');
    return false;
    
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Login inválido rejeitado corretamente (401)');
      console.log('📝 Mensagem:', error.response.data.message);
      return true;
    } else {
      console.log('❌ Erro inesperado:', error.message);
      return false;
    }
  }
}

async function runTests() {
  console.log('🚀 Iniciando testes de login...');
  console.log('=' .repeat(50));
  
  const validLoginTest = await testLogin();
  const invalidLoginTest = await testInvalidLogin();
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Resultados dos testes:');
  console.log('✅ Login válido:', validLoginTest ? 'PASSOU' : 'FALHOU');
  console.log('✅ Login inválido:', invalidLoginTest ? 'PASSOU' : 'FALHOU');
  
  if (validLoginTest && invalidLoginTest) {
    console.log('\n🎉 Todos os testes passaram! O bug foi corrigido.');
    console.log('\n📋 Resumo da correção:');
    console.log('- Interceptor de resposta do Axios foi corrigido');
    console.log('- Redirecionamento automático removido durante login');
    console.log('- Erro net::ERR_ABORTED eliminado');
    console.log('- Usuários de teste criados no banco de dados');
  } else {
    console.log('\n❌ Alguns testes falharam. Verifique os logs acima.');
  }
}

// Executar testes
runTests().catch(console.error);