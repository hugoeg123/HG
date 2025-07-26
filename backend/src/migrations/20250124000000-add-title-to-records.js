'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('records', 'title', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'Registro sem título' // Valor padrão para registros existentes
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('records', 'title');
  }
};