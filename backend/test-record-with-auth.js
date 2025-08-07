/**
 * Script para testar criação de registros com autenticação
 * 
 * Este script:
 * 1. Faz login com credenciais válidas
 * 2. Usa o token para criar um registro
 * 3. Mostra logs detalhados para debug
 */

const axios = require('axios');

async function testRecordCreation() {
  try {
    console.log('🔐 Fazendo login...');
    
    // 1. Login com credenciais do seeder
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'joao.silva@example.com',
      password: 'senha123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login realizado com sucesso!');
    console.log('Token:', loginResponse.data.token.substring(0, 20) + '...');
    console.log('Usuário:', loginResponse.data.user.name);
    
    const token = loginResponse.data.token;
    
    console.log('\n📝 Testando criação de registro...');
    
    // 2. Criar um registro de teste
    const recordData = {
      title: '🩺 Consulta de Teste',
      content: 'Este é um registro de teste para verificar se a API está funcionando corretamente. #PRESSAO: 120/80 #PESO: 70kg #ALTURA: 1.75m',
      type: 'anamnese',
      patientId: '41f2c06f-74c5-4414-aabe-dbdc84d43cbd', // UUID válido do paciente João Silva
      date: new Date().toISOString(),
      tags: [], // Removendo tags por enquanto para testar sem elas
      metadata: {
        source: 'test-script',
        version: '1.0'
      }
    };
    
    console.log('Dados do registro:', {
      title: recordData.title,
      type: recordData.type,
      contentLength: recordData.content.length,
      patientId: recordData.patientId
    });
    
    const recordResponse = await axios.post('http://localhost:5001/api/records', recordData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('\n✅ Registro criado com sucesso!');
    console.log('Status:', recordResponse.status);
    console.log('Resposta completa:', JSON.stringify(recordResponse.data, null, 2));
    
    if (recordResponse.data.data) {
      console.log('ID do registro:', recordResponse.data.data.id);
      console.log('Título:', recordResponse.data.data.title);
      console.log('Tipo:', recordResponse.data.data.type);
    }
    
  } catch (error) {
    console.error('\n❌ Erro no teste:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Mensagem:', error.response.data.message || error.response.data);
      console.error('Dados completos:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('Erro de rede:', error.message);
    } else {
      console.error('Erro:', error.message);
    }
  }
}

// Executar teste
testRecordCreation();