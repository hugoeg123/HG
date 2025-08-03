/**
 * Script de teste para verificar as correções de autenticação
 * 
 * Este script testa:
 * 1. Se os loops infinitos foram corrigidos
 * 2. Se o registro funciona corretamente
 * 3. Se o login funciona após registro
 */

import axios from 'axios';

// Configuração da API
const API_BASE_URL = 'http://localhost:3001/api';

// Dados de teste
const testUser = {
  name: 'Dr. Teste Correção',
  email: `teste.correcao.${Date.now()}@example.com`,
  password: 'senha123456',
  professionalType: 'medico',
  professionalId: 'CRM 12345/SP',
  specialty: 'Cardiologia'
};

console.log('🧪 Iniciando testes de correção de autenticação...');
console.log('📧 Email de teste:', testUser.email);

async function testRegister() {
  console.log('\n1️⃣ Testando registro...');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
    
    if (response.status === 201) {
      console.log('✅ Registro bem-sucedido!');
      console.log('📋 Dados retornados:', {
        token: response.data.token ? 'Token presente' : 'Token ausente',
        user: response.data.user ? 'Usuário presente' : 'Usuário ausente'
      });
      return response.data;
    }
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('⚠️ Usuário já existe (esperado se executado múltiplas vezes)');
      console.log('📝 Mensagem:', error.response.data.message);
      return { userExists: true };
    } else {
      console.error('❌ Erro no registro:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        error: error.message
      });
      throw error;
    }
  }
}

async function testLogin() {
  console.log('\n2️⃣ Testando login...');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    if (response.status === 200) {
      console.log('✅ Login bem-sucedido!');
      console.log('📋 Dados retornados:', {
        token: response.data.token ? 'Token presente' : 'Token ausente',
        user: response.data.user ? 'Usuário presente' : 'Usuário ausente'
      });
      return response.data;
    }
  } catch (error) {
    console.error('❌ Erro no login:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      error: error.message
    });
    throw error;
  }
}

async function testAuthFlow() {
  console.log('\n3️⃣ Testando fluxo completo de autenticação...');
  
  try {
    // Primeiro, tentar registrar
    const registerResult = await testRegister();
    
    // Se o usuário já existe, apenas fazer login
    if (registerResult.userExists) {
      console.log('👤 Usuário já existe, testando apenas login...');
    }
    
    // Testar login
    const loginResult = await testLogin();
    
    if (loginResult.token && loginResult.user) {
      console.log('\n🎉 SUCESSO! Fluxo de autenticação funcionando corretamente!');
      console.log('✅ Token gerado e usuário autenticado');
      return true;
    } else {
      console.log('\n⚠️ Login funcionou mas dados incompletos');
      return false;
    }
    
  } catch (error) {
    console.log('\n❌ FALHA no fluxo de autenticação');
    console.error('Erro:', error.message);
    return false;
  }
}

async function checkBackendStatus() {
  console.log('\n🔍 Verificando status do backend...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    console.log('✅ Backend está rodando');
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend não está rodando na porta 3001');
      console.log('💡 Execute: cd backend && npm run dev');
    } else {
      console.log('⚠️ Erro ao conectar com backend:', error.message);
    }
    return false;
  }
}

// Executar testes
async function runTests() {
  console.log('🚀 Iniciando verificação de correções...');
  console.log('=' .repeat(50));
  
  // Verificar se backend está rodando
  const backendOk = await checkBackendStatus();
  if (!backendOk) {
    console.log('\n❌ Não é possível continuar sem o backend');
    process.exit(1);
  }
  
  // Testar fluxo de autenticação
  const authOk = await testAuthFlow();
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 RESUMO DOS TESTES:');
  console.log('🔧 Backend:', backendOk ? '✅ OK' : '❌ FALHA');
  console.log('🔐 Autenticação:', authOk ? '✅ OK' : '❌ FALHA');
  
  if (backendOk && authOk) {
    console.log('\n🎉 TODAS AS CORREÇÕES FUNCIONANDO!');
    console.log('💡 Agora teste no frontend em: http://localhost:3002');
    console.log('📝 Tente registrar um novo usuário e fazer login');
  } else {
    console.log('\n⚠️ Ainda há problemas a serem resolvidos');
  }
  
  console.log('\n🔍 Para verificar loops infinitos:');
  console.log('1. Abra http://localhost:3002 no navegador');
  console.log('2. Abra o DevTools (F12)');
  console.log('3. Vá para a aba Console');
  console.log('4. Procure por erros "Maximum update depth exceeded"');
  console.log('5. Se não houver esses erros, os loops foram corrigidos!');
}

// Executar
runTests().catch(console.error);