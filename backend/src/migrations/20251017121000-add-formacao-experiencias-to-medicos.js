'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Adicionar coluna JSONB para formação acadêmica
    await queryInterface.addColumn('medicos', 'formacao', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: [],
      comment: 'Lista de formações acadêmicas do médico'
    });

    // Adicionar coluna JSONB para experiências profissionais
    await queryInterface.addColumn('medicos', 'experiencias', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: [],
      comment: 'Lista de experiências profissionais do médico'
    });
  },

  async down (queryInterface, Sequelize) {
    // Remover colunas adicionadas
    await queryInterface.removeColumn('medicos', 'formacao');
    await queryInterface.removeColumn('medicos', 'experiencias');
  }
};