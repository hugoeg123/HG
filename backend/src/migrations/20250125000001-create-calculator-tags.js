'use strict';

/**
 * Migração para criar tabela de associação Calculator-Tag
 * 
 * Cria a tabela calculator_tags para relacionamento many-to-many
 * entre calculadoras e tags
 * 
 * Conector: Usado pelo modelo CalculatorTag.js
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('calculator_tags', {
      calculator_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'calculators',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      tag_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tags',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Criar índice único para evitar duplicatas
    await queryInterface.addIndex('calculator_tags', {
      fields: ['calculator_id', 'tag_id'],
      unique: true,
      name: 'calculator_tags_unique_idx'
    });

    // Criar índices para performance
    await queryInterface.addIndex('calculator_tags', {
      fields: ['calculator_id'],
      name: 'calculator_tags_calculator_id_idx'
    });

    await queryInterface.addIndex('calculator_tags', {
      fields: ['tag_id'],
      name: 'calculator_tags_tag_id_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('calculator_tags');
  }
};