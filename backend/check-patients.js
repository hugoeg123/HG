/**
 * Script para verificar pacientes no banco de dados
 */

const { Patient } = require('./src/models');

async function checkPatients() {
  try {
    console.log('🔍 Verificando pacientes no banco de dados...');
    
    const patients = await Patient.findAll({
      attributes: ['id', 'name', 'dateOfBirth', 'gender', 'cpf'],
      limit: 10
    });
    
    console.log(`📊 Total de pacientes encontrados: ${patients.length}`);
    
    if (patients.length > 0) {
      console.log('\n👥 Lista de pacientes:');
      patients.forEach((patient, index) => {
        console.log(`${index + 1}. ID: ${patient.id}`);
        console.log(`   Nome: ${patient.name || 'Sem nome'}`);
        console.log(`   Data Nascimento: ${patient.dateOfBirth || 'Não informado'}`);
        console.log(`   Gênero: ${patient.gender || 'Não informado'}`);
        console.log(`   CPF: ${patient.cpf || 'Não informado'}`);
        console.log('---');
      });
    } else {
      console.log('❌ Nenhum paciente encontrado no banco de dados.');
      console.log('💡 Sugestão: Execute o seeder ou crie pacientes manualmente.');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar pacientes:', error.message);
  } finally {
    process.exit(0);
  }
}

checkPatients();