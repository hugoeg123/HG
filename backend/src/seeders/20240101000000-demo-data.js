/**
 * Seeder para popular o banco de dados PostgreSQL com dados iniciais
 * 
 * Este arquivo cria dados de demonstração para testes
 * 
 * Conector: Usado pelo Sequelize CLI para popular o banco de dados
 */

'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Gerar hash para senha padrão
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('senha123', salt);
    
    // Criar médicos
    const medicos = [
      {
        id: uuidv4(),
        nome: 'Dr. João Silva',
        email: 'joao.silva@example.com',
        senha_hash: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        nome: 'Dra. Maria Santos',
        email: 'maria.santos@example.com',
        senha_hash: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    await queryInterface.bulkInsert('medicos', medicos, {});
    
    // Criar tags personalizadas para o primeiro médico
    const customTags = [
      {
        id: uuidv4(),
        medico_id: medicos[0].id,
        parent_id: null,
        codigo: '#URGENTE',
        nome: 'Casos Urgentes',
        tipo_dado: 'texto',
        regras_validacao: JSON.stringify({}),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        medico_id: medicos[0].id,
        parent_id: null,
        codigo: '#CONSULTA',
        nome: 'Consulta Médica',
        tipo_dado: 'texto',
        regras_validacao: JSON.stringify({}),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        medico_id: medicos[1].id,
        parent_id: null,
        codigo: '#EXAME',
        nome: 'Resultados de Exames',
        tipo_dado: 'texto',
        regras_validacao: JSON.stringify({}),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Tags estruturadas com validação - Story 2.1
      {
        id: uuidv4(),
        medico_id: null, // Tag global
        parent_id: null,
        codigo: '#PESO',
        nome: 'Peso do Paciente',
        tipo_dado: 'numero',
        regras_validacao: JSON.stringify({
          unidade: 'kg',
          min: 0.5,
          max: 500,
          decimais: 1,
          sufixos_aceitos: ['kg', 'quilos', 'kilos']
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        medico_id: null, // Tag global
        parent_id: null,
        codigo: '#ALTURA',
        nome: 'Altura do Paciente',
        tipo_dado: 'numero',
        regras_validacao: JSON.stringify({
          unidade: 'm',
          min: 0.3,
          max: 2.5,
          decimais: 2,
          sufixos_aceitos: ['m', 'metros', 'cm', 'centimetros'],
          conversoes: {
            'cm': 0.01,
            'centimetros': 0.01
          }
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        medico_id: null, // Tag global
        parent_id: null,
        codigo: '#PA',
        nome: 'Pressão Arterial',
        tipo_dado: 'bp',
        regras_validacao: JSON.stringify({
          unidade: 'mmHg',
          sistolica: {
            min: 60,
            max: 250
          },
          diastolica: {
            min: 30,
            max: 150
          },
          formato: 'sistolica/diastolica',
          separadores_aceitos: ['/', 'x', 'por']
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    await queryInterface.bulkInsert('tags', customTags, {});
    
    // Criar pacientes (comentado para evitar dados mock)
    // const pacientes = [
    //   {
    //     id: uuidv4(),
    //     nome: 'Ana Costa',
    //     createdAt: new Date(),
    //     updatedAt: new Date()
    //   },
    //   {
    //     id: uuidv4(),
    //     nome: 'Carlos Oliveira',
    //     createdAt: new Date(),
    //     updatedAt: new Date()
    //   }
    // ];
    
    // await queryInterface.bulkInsert('pacientes', pacientes, {});
    
    // Criar registros de exemplo (comentado para evitar dados mock)
    // const registros = [
    //   {
    //     id: uuidv4(),
    //     medico_id: medicos[0].id,
    //     paciente_id: pacientes[0].id,
    //     created_at: new Date(),
    //     conteudo_raw: '#QP: Dor de cabeça há 3 dias\n#HDA: Paciente relata cefaleia pulsátil\n#PA: 120/80'
    //   },
    //   {
    //     id: uuidv4(),
    //     medico_id: medicos[1].id,
    //     paciente_id: pacientes[1].id,
    //     created_at: new Date(),
    //     conteudo_raw: '#QP: Dor no peito\n#HDA: Dor precordial há 2 horas\n#ECG: Normal'
    //   }
    // ];
    
    // await queryInterface.bulkInsert('registros', registros, {});
  },

  down: async (queryInterface, Sequelize) => {
    // Remover dados na ordem inversa para evitar problemas com chaves estrangeiras
    await queryInterface.bulkDelete('registros', null, {});
    await queryInterface.bulkDelete('pacientes', null, {});
    await queryInterface.bulkDelete('tags', null, {});
    await queryInterface.bulkDelete('medicos', null, {});
  }
};