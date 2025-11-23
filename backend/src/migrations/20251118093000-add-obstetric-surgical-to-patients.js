"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('patients', 'obstetricHistory', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('patients', 'surgicalHistory', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: []
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('patients', 'surgicalHistory');
    await queryInterface.removeColumn('patients', 'obstetricHistory');
  }
};