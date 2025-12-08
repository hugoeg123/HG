'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Check if columns exist before adding them to avoid errors if partial migration happened manually
    const tableInfo = await queryInterface.describeTable('medicos');

    if (!tableInfo.titulo_profissional) {
      await queryInterface.addColumn('medicos', 'titulo_profissional', {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Título profissional do médico (ex: Cardiologista, Clínico Geral)'
      });
    }

    if (!tableInfo.biografia) {
      await queryInterface.addColumn('medicos', 'biografia', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Biografia/apresentação profissional do médico'
      });
    }

    if (!tableInfo.avatar_url) {
      await queryInterface.addColumn('medicos', 'avatar_url', {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'URL da foto de perfil do médico'
      });
    }

    if (!tableInfo.curriculo_url) {
      await queryInterface.addColumn('medicos', 'curriculo_url', {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'URL do currículo em PDF do médico'
      });
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('medicos', 'titulo_profissional');
    await queryInterface.removeColumn('medicos', 'biografia');
    await queryInterface.removeColumn('medicos', 'avatar_url');
    await queryInterface.removeColumn('medicos', 'curriculo_url');
  }
};
