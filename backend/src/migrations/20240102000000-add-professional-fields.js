/**
 * Migração para adicionar campos profissionais à tabela users
 * 
 * Adiciona as colunas: professionalType, professionalId, specialty, isActive
 */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Adicionar coluna professionalType
    await queryInterface.addColumn('users', 'professionalType', {
      type: Sequelize.ENUM('medico', 'enfermeiro', 'fisioterapeuta', 'psicologo', 'nutricionista', 'farmaceutico', 'outro'),
      allowNull: false,
      defaultValue: 'medico'
    });

    // Adicionar coluna professionalId
    await queryInterface.addColumn('users', 'professionalId', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'CRM, COREN, CRF, etc.'
    });

    // Adicionar coluna specialty
    await queryInterface.addColumn('users', 'specialty', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Adicionar coluna isActive
    await queryInterface.addColumn('users', 'isActive', {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remover as colunas na ordem inversa
    await queryInterface.removeColumn('users', 'isActive');
    await queryInterface.removeColumn('users', 'specialty');
    await queryInterface.removeColumn('users', 'professionalId');
    await queryInterface.removeColumn('users', 'professionalType');
  }
};