'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // 1. Add patient_id column
        await queryInterface.addColumn('alerts', 'patient_id', {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
                model: 'patients',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        });

        // 2. Change record_id to allow null
        await queryInterface.changeColumn('alerts', 'record_id', {
            type: Sequelize.UUID,
            allowNull: true, // Now optional
            references: {
                model: 'registros',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Revert changes
        await queryInterface.removeColumn('alerts', 'patient_id');

        // Note: Reverting allow null to false might fail if there are null records
        await queryInterface.changeColumn('alerts', 'record_id', {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
                model: 'registros',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        });
    }
};
