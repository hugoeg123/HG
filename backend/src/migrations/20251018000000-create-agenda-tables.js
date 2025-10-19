'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Create availability_slots table
    await queryInterface.createTable('availability_slots', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      medico_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'medicos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      start_time: {
        type: 'TIMESTAMPTZ',
        allowNull: false
      },
      end_time: {
        type: 'TIMESTAMPTZ',
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('available', 'booked', 'blocked'),
        allowNull: false,
        defaultValue: 'available'
      },
      modality: {
        type: Sequelize.ENUM('presencial', 'telemedicina'),
        allowNull: false,
        defaultValue: 'presencial'
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: 'TIMESTAMPTZ',
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      },
      updatedAt: {
        type: 'TIMESTAMPTZ',
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      }
    });

    await queryInterface.addIndex('availability_slots', ['medico_id']);
    await queryInterface.addIndex('availability_slots', ['start_time']);
    await queryInterface.addIndex('availability_slots', ['status']);
    await queryInterface.addIndex('availability_slots', ['modality']);
    await queryInterface.addIndex('availability_slots', ['medico_id', 'start_time'], { name: 'availability_slots_medico_start_idx' });

    // Create appointments table
    await queryInterface.createTable('appointments', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      slot_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'availability_slots',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      patient_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'patients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('booked', 'cancelled', 'completed', 'no_show'),
        allowNull: false,
        defaultValue: 'booked'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: 'TIMESTAMPTZ',
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      },
      updatedAt: {
        type: 'TIMESTAMPTZ',
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      }
    });

    await queryInterface.addIndex('appointments', ['slot_id']);
    await queryInterface.addIndex('appointments', ['patient_id']);
    await queryInterface.addIndex('appointments', ['status']);
  },

  async down (queryInterface, Sequelize) {
    // Drop appointments first due to FK
    await queryInterface.dropTable('appointments');
    await queryInterface.dropTable('availability_slots');

    // Drop enum types created by Sequelize (Postgres)
    try {
      await queryInterface.sequelize.query("DROP TYPE IF EXISTS enum_availability_slots_status;");
      await queryInterface.sequelize.query("DROP TYPE IF EXISTS enum_availability_slots_modality;");
      await queryInterface.sequelize.query("DROP TYPE IF EXISTS enum_appointments_status;");
    } catch (err) {
      // ignore if not exist
    }
  }
};