'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Adicionar coluna public_visibility
    await queryInterface.addColumn('medicos', 'public_visibility', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Controle de visibilidade pública no marketplace'
    });
  },

  async down (queryInterface, Sequelize) {
    // Remover coluna public_visibility
    await queryInterface.removeColumn('medicos', 'public_visibility');
  }
};