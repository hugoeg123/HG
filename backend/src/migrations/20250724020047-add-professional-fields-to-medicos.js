'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Adicionar coluna professional_type
    await queryInterface.addColumn('medicos', 'professional_type', {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'medico'
    });

    // Adicionar coluna professional_id
    await queryInterface.addColumn('medicos', 'professional_id', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'CRM, COREN, CRF, etc.'
    });

    // Adicionar coluna specialty
    await queryInterface.addColumn('medicos', 'specialty', {
      type: Sequelize.STRING(100),
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    // Remover as colunas na ordem inversa
    await queryInterface.removeColumn('medicos', 'specialty');
    await queryInterface.removeColumn('medicos', 'professional_id');
    await queryInterface.removeColumn('medicos', 'professional_type');
  }
};
