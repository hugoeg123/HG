'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Verificar se a coluna já existe antes de adicionar
    const tableDescription = await queryInterface.describeTable('tags');
    
    if (!tableDescription.color) {
      await queryInterface.addColumn('tags', 'color', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '#6366f1'
      });
    }
  },

  async down (queryInterface, Sequelize) {
    // Verificar se a coluna existe antes de remover
    const tableDescription = await queryInterface.describeTable('tags');
    
    if (tableDescription.color) {
      await queryInterface.removeColumn('tags', 'color');
    }
  }
};
