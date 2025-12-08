"use strict";

/**
 * Migration: Create reviews table
 *
 * Connector: links doctors (medicos) with patients via feedback
 * Hooks:
 * - Referenced by models in `backend/src/models/sequelize/Review.js`
 * - Used by review.controller for CRUD operations
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("reviews", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true,
        allowNull: false,
      },
      medico_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "medicos", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      patient_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "patients", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_public: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("reviews", ["medico_id"], {
      name: "reviews_medico_id_idx",
    });
    await queryInterface.addIndex("reviews", ["patient_id"], {
      name: "reviews_patient_id_idx",
    });
    await queryInterface.addIndex("reviews", ["medico_id", "is_public"], {
      name: "reviews_medico_public_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("reviews", "reviews_patient_id_idx");
    await queryInterface.removeIndex("reviews", "reviews_medico_public_idx");
    await queryInterface.removeIndex("reviews", "reviews_medico_id_idx");
    await queryInterface.dropTable("reviews");
  },
};