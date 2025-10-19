'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'postgres') {
      // Add new enum value for modality in Postgres
      await queryInterface.sequelize.query(
        'ALTER TYPE "enum_availability_slots_modality" ADD VALUE IF NOT EXISTS \"domiciliar\";'
      );
    } else {
      // For other dialects, change column to include the new value
      await queryInterface.changeColumn('availability_slots', 'modality', {
        type: Sequelize.ENUM('presencial', 'telemedicina', 'domiciliar'),
        allowNull: false,
        defaultValue: 'presencial'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'postgres') {
      // Revert by recreating enum without 'domiciliar'
      await queryInterface.sequelize.query(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_availability_slots_modality') THEN
            CREATE TYPE "enum_availability_slots_modality_old" AS ENUM ('presencial', 'telemedicina');
            ALTER TABLE "availability_slots" ALTER COLUMN "modality" TYPE "enum_availability_slots_modality_old"
            USING CASE WHEN "modality" IN ('presencial', 'telemedicina') THEN "modality" ELSE 'presencial' END;
            DROP TYPE "enum_availability_slots_modality";
            ALTER TYPE "enum_availability_slots_modality_old" RENAME TO "enum_availability_slots_modality";
          END IF;
        END
        $$;
      `);
    } else {
      await queryInterface.changeColumn('availability_slots', 'modality', {
        type: Sequelize.ENUM('presencial', 'telemedicina'),
        allowNull: false,
        defaultValue: 'presencial'
      });
    }
  }
};