/**
 * Script de teste para verificar o dashboard do paciente
 * 
 * Testa a integração completa:
 * 1. Login no sistema
 * 2. Busca de pacientes
 * 3. Carregamento do dashboard de um paciente específico
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testPatientDashboard() {
  try {
    console.log('🔐 Fazendo login...');
    
    // 1. Login
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'joao.silva@example.com',
      password: 'senha123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login realizado com sucesso');
    
    // 2. Buscar pacientes
    console.log('\n👥 Buscando pacientes...');
    const patientsResponse = await axios.get(`${BASE_URL}/patients`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const responseData = patientsResponse.data;
    const patients = responseData.patients; // A resposta tem estrutura {patients: [...], pagination: {...}}
    console.log(`✅ Encontrados ${patients?.length || 0} pacientes`);
    
    if (!patients || patients.length === 0) {
      console.log('❌ Nenhum paciente encontrado para testar o dashboard');
      return;
    }
    
    // 3. Testar dashboard do primeiro paciente
    const firstPatient = patients[0];
    console.log(`\n📊 Testando dashboard do paciente: ${firstPatient.name} (ID: ${firstPatient.id})`);
    
    const dashboardResponse = await axios.get(`${BASE_URL}/patients/${firstPatient.id}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const dashboardData = dashboardResponse.data;
    console.log('✅ Dashboard carregado com sucesso!');
    console.log('📋 Dados do dashboard:');
    console.log(`   - Nome: ${dashboardData.patientName}`);
    console.log(`   - Última atualização: ${dashboardData.lastUpdated}`);
    console.log(`   - Problemas ativos: ${dashboardData.problemasAtivos?.length || 0}`);
    console.log(`   - Alergias: ${dashboardData.alergias?.length || 0}`);
    console.log(`   - Medicamentos em uso: ${dashboardData.medicamentosEmUso?.length || 0}`);
    console.log(`   - Investigações em andamento: ${dashboardData.investigacoesEmAndamento?.length || 0}`);
    console.log(`   - Resultados recentes: ${dashboardData.resultadosRecentes?.length || 0}`);
    console.log(`   - Histórico de consultas: ${dashboardData.historicoConsultas?.length || 0}`);
    
    console.log('\n🎉 Teste do dashboard do paciente concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.response?.data || error.message);
  }
}

testPatientDashboard();