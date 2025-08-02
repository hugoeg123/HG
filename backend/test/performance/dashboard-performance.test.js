/**
 * Teste de Performance para Dashboard do Paciente
 * 
 * Story 2.2.P: Valida que o endpoint /api/patients/:id/dashboard
 * responde em menos de 1000ms para pacientes com histórico extenso
 * 
 * Conector: Testa integração completa controller -> service -> database
 * Hook: Simula cenários reais de pacientes com 100+ registros
 */

const request = require('supertest');
const app = require('../../src/app');
const { Patient, Record, Tag, User } = require('../../src/models');
const { sequelize } = require('../../src/config/database-pg');

describe('Dashboard Performance Tests', () => {
  let authToken;
  let testUser;
  let testPatient;
  let testTags;

  beforeAll(async () => {
    // Criar usuário de teste
    testUser = await User.create({
      name: 'Performance Test User',
      email: 'perf.test@example.com',
      password: 'password123',
      isAdmin: false
    });

    // Fazer login para obter token
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: 'perf.test@example.com',
        password: 'password123'
      });
    
    authToken = loginResponse.body.token;

    // Criar paciente de teste
    testPatient = await Patient.create({
      name: 'Paciente Performance Test',
      email: 'paciente.perf@example.com',
      phone: '11999999999',
      birthDate: '1980-01-01',
      gender: 'M',
      address: 'Rua Teste, 123'
    });

    // Criar tags de teste
    testTags = await Tag.bulkCreate([
      {
        codigo: '#DX',
        nome: 'Diagnóstico',
        tipo_dado: 'texto'
      },
      {
        codigo: '#MEDICAMENTO',
        nome: 'Medicamento',
        tipo_dado: 'texto'
      },
      {
        codigo: '#ALERGIA',
        nome: 'Alergia',
        tipo_dado: 'texto'
      },
      {
        codigo: '#EXAME',
        nome: 'Exame',
        tipo_dado: 'texto'
      },
      {
        codigo: '#PA',
        nome: 'Pressão Arterial',
        tipo_dado: 'bp'
      }
    ]);
  });

  afterAll(async () => {
    // Limpar dados de teste
    await Record.destroy({ where: { patientId: testPatient.id } });
    await Patient.destroy({ where: { id: testPatient.id } });
    await Tag.destroy({ where: { id: testTags.map(t => t.id) } });
    await User.destroy({ where: { id: testUser.id } });
  });

  describe('Performance with Large Dataset', () => {
    beforeEach(async () => {
      // Criar 150 registros para simular paciente com histórico extenso
      const records = [];
      const baseDate = new Date('2023-01-01');
      
      for (let i = 0; i < 150; i++) {
        const recordDate = new Date(baseDate);
        recordDate.setDate(baseDate.getDate() + i);
        
        records.push({
          patientId: testPatient.id,
          title: `Consulta ${i + 1}`,
          type: i % 3 === 0 ? 'consulta' : i % 3 === 1 ? 'exame' : 'procedimento',
          date: recordDate,
          content: generateRecordContent(i),
          tags: [],
          createdBy: testUser.id,
          isDeleted: false
        });
      }
      
      await Record.bulkCreate(records);
    });

    afterEach(async () => {
      // Limpar registros após cada teste
      await Record.destroy({ where: { patientId: testPatient.id } });
    });

    test('Dashboard deve responder em menos de 1000ms com 150 registros', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get(`/api/patients/${testPatient.id}/dashboard`)
        .set('Authorization', `Bearer ${authToken}`);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`⏱️ Tempo de resposta: ${responseTime}ms`);
      
      // Verificar se a resposta foi bem-sucedida
      expect(response.status).toBe(200);
      
      // Verificar se o tempo de resposta está dentro do critério
      expect(responseTime).toBeLessThan(1000);
      
      // Verificar estrutura da resposta
      expect(response.body).toHaveProperty('patientId');
      expect(response.body).toHaveProperty('patientName');
      expect(response.body).toHaveProperty('problemasAtivos');
      expect(response.body).toHaveProperty('alergias');
      expect(response.body).toHaveProperty('medicamentosEmUso');
      expect(response.body).toHaveProperty('investigacoesEmAndamento');
      expect(response.body).toHaveProperty('resultadosRecentes');
      expect(response.body).toHaveProperty('historicoConsultas');
    });

    test('Dashboard deve manter estrutura JSON consistente', async () => {
      const response = await request(app)
        .get(`/api/patients/${testPatient.id}/dashboard`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      
      // Verificar que arrays estão presentes (mesmo que vazios)
      expect(Array.isArray(response.body.problemasAtivos)).toBe(true);
      expect(Array.isArray(response.body.alergias)).toBe(true);
      expect(Array.isArray(response.body.medicamentosEmUso)).toBe(true);
      expect(Array.isArray(response.body.investigacoesEmAndamento)).toBe(true);
      expect(Array.isArray(response.body.resultadosRecentes)).toBe(true);
      expect(Array.isArray(response.body.historicoConsultas)).toBe(true);
    });

    test('Dashboard deve processar múltiplas requisições concorrentes', async () => {
      const concurrentRequests = 5;
      const promises = [];
      
      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          request(app)
            .get(`/api/patients/${testPatient.id}/dashboard`)
            .set('Authorization', `Bearer ${authToken}`)
        );
      }
      
      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      
      console.log(`⏱️ Tempo para ${concurrentRequests} requisições concorrentes: ${endTime - startTime}ms`);
      
      // Todas as respostas devem ser bem-sucedidas
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Tempo total não deve exceder 3 segundos para 5 requisições
      expect(endTime - startTime).toBeLessThan(3000);
    });
  });
});

/**
 * Gera conteúdo de registro variado para testes
 * @param {number} index - Índice do registro
 * @returns {string} Conteúdo do registro
 */
function generateRecordContent(index) {
  const templates = [
    `#QP: Paciente relata dor abdominal há ${index % 7 + 1} dias\n#DX: Gastrite aguda\n#MEDICAMENTO: Omeprazol 20mg 1x/dia`,
    `#PA: ${120 + (index % 40)}/${80 + (index % 20)}\n#EXAME: Hemograma completo solicitado\n#PLANO: Retorno em 7 dias`,
    `#ALERGIA: ${index % 2 === 0 ? 'Penicilina' : 'AAS'}\n#HDA: Paciente com histórico de hipertensão\n#MEDICAMENTO: Losartana 50mg`,
    `#RESULTADO: Glicemia: ${90 + (index % 50)}mg/dL\n#INVESTIGACAO: Solicitar HbA1c\n#PLANO: Dieta hipoglicídica`,
    `#EF: Paciente em bom estado geral\n#DX: Hipertensão arterial sistêmica\n#MEDICAMENTO: Enalapril 10mg 2x/dia`
  ];
  
  return templates[index % templates.length];
}