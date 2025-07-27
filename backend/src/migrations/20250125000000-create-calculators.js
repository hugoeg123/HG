/**
 * Migração: Criação da tabela calculators
 * 
 * Cria a estrutura de dados para o sistema de calculadoras médicas
 * com suporte a fórmulas dinâmicas e campos flexíveis usando JSONB
 * 
 * Conectores:
 * - Referencia tabela 'users' via foreign key owner_id
 * - Integra com modelo Calculator.js
 */

'use strict';

module.exports = {
  /**
   * Executa a migração - cria a tabela calculators
   * @param {QueryInterface} queryInterface Interface do Sequelize para queries
   * @param {DataTypes} Sequelize Tipos de dados do Sequelize
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('calculators', {
      // ID da calculadora (chave primária UUID)
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false
      },
      
      // Nome da calculadora
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      
      // Descrição da calculadora
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      
      // Categoria da calculadora
      category: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      
      // Fórmula compatível com mathjs
      formula: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      
      // Campos de entrada (JSONB para flexibilidade)
      // Exemplo: [{"name": "peso", "label": "Peso (kg)", "type": "number"}]
      fields: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      
      // Indica se a calculadora é pública
      is_public: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      
      // ID do médico proprietário (foreign key)
      owner_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'medicos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      
      // Timestamp de criação
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      },
      
      // Timestamp de atualização
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    // Criar índices para otimizar consultas
    
    // Índice para busca por categoria
    await queryInterface.addIndex('calculators', ['category'], {
      name: 'calculators_category_idx'
    });
    
    // Índice para busca por proprietário
    await queryInterface.addIndex('calculators', ['owner_id'], {
      name: 'calculators_owner_id_idx'
    });
    
    // Índice para calculadoras públicas
    await queryInterface.addIndex('calculators', ['is_public'], {
      name: 'calculators_is_public_idx'
    });
    
    // Índice composto para busca eficiente (públicas + do usuário)
    await queryInterface.addIndex('calculators', ['owner_id', 'is_public'], {
      name: 'calculators_owner_public_idx'
    });
    
    // Índice para busca por nome (para autocomplete)
    await queryInterface.addIndex('calculators', ['name'], {
      name: 'calculators_name_idx'
    });
  },

  /**
   * Reverte a migração - remove a tabela calculators
   * @param {QueryInterface} queryInterface Interface do Sequelize para queries
   * @param {DataTypes} Sequelize Tipos de dados do Sequelize
   */
  async down(queryInterface, Sequelize) {
    // Remove índices primeiro
    await queryInterface.removeIndex('calculators', 'calculators_name_idx');
    await queryInterface.removeIndex('calculators', 'calculators_owner_public_idx');
    await queryInterface.removeIndex('calculators', 'calculators_is_public_idx');
    await queryInterface.removeIndex('calculators', 'calculators_owner_id_idx');
    await queryInterface.removeIndex('calculators', 'calculators_category_idx');
    
    // Remove a tabela
    await queryInterface.dropTable('calculators');
  }
};