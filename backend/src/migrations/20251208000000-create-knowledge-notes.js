"use strict";

/**
 * Migration: Create knowledge_notes table
 *
 * Connector: Stores user notes from the Knowledge Base
 * Hooks:
 * - Referenced by models in `backend/src/models/sequelize/KnowledgeNote.js`
 * - Used by knowledge.controller for CRUD operations
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("knowledge_notes", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "medicos", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      related_term: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      is_public: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      author_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("knowledge_notes", ["user_id"], {
      name: "knowledge_notes_user_id_idx",
    });
    await queryInterface.addIndex("knowledge_notes", ["related_term"], {
      name: "knowledge_notes_related_term_idx",
    });
    await queryInterface.addIndex("knowledge_notes", ["is_public"], {
      name: "knowledge_notes_is_public_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("knowledge_notes", "knowledge_notes_is_public_idx");
    await queryInterface.removeIndex("knowledge_notes", "knowledge_notes_related_term_idx");
    await queryInterface.removeIndex("knowledge_notes", "knowledge_notes_user_id_idx");
    await queryInterface.dropTable("knowledge_notes");
  },
};
