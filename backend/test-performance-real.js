/**
 * Teste de Performance Real - Dashboard do Paciente
 * 
 * Cria um paciente com muitos registros para testar performance
 */

const { Patient, Record, Tag, User } = require('./src/models/sequelize');
const request = require('supertest');
const app = require('./src/app');

async function createPerformanceTest() {
  console.log('🚀 Iniciando teste de performance...');
  
  let patient;
  let records = [];
  let testUser;
  
  try {
    // Criar usuário de teste
    testUser = await User.create({
      name: 'Test User Performance',
      email: 'testperf@example.com',
      password: 'hashedpassword123',
      crm: 'TEST123',
      specialty: 'Clínica Geral'
    });
    
    console.log('👨‍⚕️ Usuário criado:', testUser.id);
    
    // Criar paciente de teste
    patient = await Patient.create({
      name: 'Paciente Performance Test',
      dateOfBirth: '1980-05-15',
      gender: 'feminino',
      cpf: '98765432100',
      email: 'performance@test.com'
    });
    
    console.log('👤 Paciente criado:', patient.id);
    
    // Criar 500 registros com diferentes tipos de conteúdo
    console.log('📝 Criando 500 registros...');
    
    const recordTypes = [
      { type: 'consulta', content: '#DX: hipertensão arterial sistêmica\n#MEDICAMENTO: losartana 50mg 1x/dia\n#ALERGIA: penicilina' },
      { type: 'exame', content: '#EXAME: hemograma completo\n#LABORATORIO: glicemia 95mg/dl, colesterol 180mg/dl' },
      { type: 'evolucao', content: '#MEDICAMENTO: metformina 850mg 2x/dia\n#PLANO: retorno em 30 dias' },
      { type: 'consulta', content: '#DX: diabetes mellitus tipo 2\n#INVESTIGACAO: solicitar HbA1c\n#MEDICAMENTO: insulina NPH' },
      { type: 'exame', content: '#LABORATORIO: HbA1c 7.2%\n#RESULTADO: alterado, ajustar medicação' }
    ];
    
    const batchSize = 50;
    for (let i = 0; i < 500; i += batchSize) {
      const batch = [];
      
      for (let j = 0; j < batchSize && (i + j) < 500; j++) {
        const recordType = recordTypes[(i + j) % recordTypes.length];
        batch.push({
          patientId: patient.id,
          title: `Registro ${i + j + 1}`,
          type: recordType.type,
          date: new Date(Date.now() - (500 - i - j) * 24 * 60 * 60 * 1000), // Datas escalonadas
          content: recordType.content,
          tags: [],
          createdBy: testUser.id,
          isDeleted: false
        });
      }
      
      const createdRecords = await Record.bulkCreate(batch);
      records.push(...createdRecords);
      
      if ((i + batchSize) % 100 === 0) {
        console.log(`📊 Criados ${Math.min(i + batchSize, 500)} registros...`);
      }
    }
    
    console.log(`✅ Total de ${records.length} registros criados`);
    
    // Executar teste de performance
    console.log('\n🔍 Executando teste de performance...');
    
    const start = Date.now();
    const response = await request(app)
      .get(`/api/patients/${patient.id}/dashboard`);
    const end = Date.now();
    
    const totalTime = end - start;
    
    console.log('\n=== RESULTADO DO TESTE DE PERFORMANCE ===');
    console.log('Status:', response.status);
    console.log('Tempo total da requisição:', totalTime, 'ms');
    console.log('Tamanho da resposta:', JSON.stringify(response.body).length, 'chars');
    
    if (response.body && response.body.problemasAtivos) {
      console.log('\n📊 Dados consolidados:');
      console.log('- Problemas Ativos:', response.body.problemasAtivos.length);
      console.log('- Alergias:', response.body.alergias.length);
      console.log('- Medicamentos:', response.body.medicamentosEmUso.length);
      console.log('- Investigações:', response.body.investigacao.length);
      console.log('- Resultados:', response.body.resultados.length);
      console.log('- Histórico:', response.body.historico.length);
    }
    
    // Verificar critério de aceitação
    if (totalTime > 1000) {
      console.log('❌ FALHOU: Tempo de resposta acima de 1000ms');
    } else {
      console.log('✅ PASSOU: Tempo de resposta dentro do critério');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  } finally {
    // Limpeza
    console.log('\n🧹 Limpando dados de teste...');
    
    if (records.length > 0) {
      await Record.destroy({
        where: {
          id: records.map(r => r.id)
        }
      });
      console.log('🗑️ Registros removidos');
    }
    
    if (patient) {
      await patient.destroy();
      console.log('🗑️ Paciente removido');
    }
    
    if (testUser) {
      await testUser.destroy();
      console.log('🗑️ Usuário removido');
    }
    
    console.log('✅ Limpeza concluída');
  }
}

// Executar teste
createPerformanceTest()
  .then(() => {
    console.log('\n🎉 Teste de performance concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });