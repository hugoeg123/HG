"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Adicionar coluna password_hash
    await queryInterface.addColumn('patients', 'password_hash', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Adicionar coluna race_color (ENUM)
    await queryInterface.addColumn('patients', 'race_color', {
      type: Sequelize.ENUM('branca', 'preta', 'parda', 'amarela', 'indigena', 'outra'),
      allowNull: true
    });

    // Adicionar coluna nationality
    await queryInterface.addColumn('patients', 'nationality', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    // Remover colunas
    await queryInterface.removeColumn('patients', 'nationality');
    await queryInterface.removeColumn('patients', 'race_color');
    await queryInterface.removeColumn('patients', 'password_hash');

    // Remover tipo ENUM criado pelo Sequelize (PostgreSQL)
    try {
      await queryInterface.sequelize.query(
        "DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_patients_race_color') THEN DROP TYPE \"enum_patients_race_color\"; END IF; END $$;"
      );
    } catch (e) {
      // Ignorar erro caso tipo não exista
    }
  }
};