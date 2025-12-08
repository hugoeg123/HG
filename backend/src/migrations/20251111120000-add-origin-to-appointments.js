/**
 * Migration: add origin column to appointments
 *
 * Connectors:
 * - Updates table used by models/sequelize/Appointment.js
 * - Enables UI conditioning in WeeklyTimeGrid via appointment origin mapping
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('appointments', 'origin', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'doctor_manual',
    });

    // Optional index for filtering by origin
    await queryInterface.addIndex('appointments', ['origin']);
  },

  async down(queryInterface) {
    try {
      await queryInterface.removeIndex('appointments', ['origin']);
    } catch (_) {
      // ignore if index does not exist
    }
    await queryInterface.removeColumn('appointments', 'origin');
  }
};