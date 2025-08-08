/**
 * Teste para reproduzir e corrigir o erro 400 na criação de registros
 */

const axios = require('axios');

// Configuração da API
const API_BASE = 'http://localhost:5000/api';

// Dados de teste
const testData = {
  title: 'Novo Registro',
  content: 'Conteúdo do registro de teste',
  patientId: '4a61ac40-8a20-4df0-b0f9-f0de4b207450',
  type: 'anamnese'
};

async function testRecordCreation() {
  try {
    console.log('🔍 Testando criação de registro...');
    console.log('📦 Dados enviados:', JSON.stringify(testData, null, 2));
    
    const response = await axios.post(`${API_BASE}/records`, testData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token-for-test' // Token fictício para teste
      }
    });
    
    console.log('✅ Sucesso:', response.status, response.data);
  } catch (error) {
    console.log('❌ Erro:', error.response?.status, error.response?.data || error.message);
    
    if (error.response?.data?.errors) {
      console.log('📋 Detalhes dos erros:');
      error.response.data.errors.forEach(err => {
        console.log(`  - Campo: ${err.field}`);
        console.log(`  - Mensagem: ${err.message}`);
        console.log(`  - Valor: ${err.value}`);
      });
    }
  }
}

// Executar teste
testRecordCreation();