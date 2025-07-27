/**
 * Migração: Criação da tabela alerts
 * 
 * Cria a estrutura de dados para o sistema de alertas médicos
 * com relacionamentos para usuários e registros médicos
 * 
 * Conectores:
 * - Referencia tabela 'users' via foreign key user_id
 * - Referencia tabela 'records' via foreign key record_id
 * - Integra com modelo Alert.js
 */

'use strict';

module.exports = {
  /**
   * Executa a migração - cria a tabela alerts
   * @param {QueryInterface} queryInterface Interface do Sequelize para queries
   * @param {DataTypes} Sequelize Tipos de dados do Sequelize
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('alerts', {
      // ID do alerta (chave primária UUID)
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false
      },
      
      // ID do médico (foreign key)
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'medicos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      
      // ID do registro médico (foreign key)
      record_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'registros',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      
      // Mensagem do alerta
      message: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      
      // Severidade do alerta
      severity: {
        type: Sequelize.ENUM('info', 'warning', 'critical'),
        allowNull: false,
        defaultValue: 'info'
      },
      
      // Indica se o alerta foi lido
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      
      // Data de leitura do alerta
      read_at: {
        type: Sequelize.DATE,
        allowNull: true
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
    
    // Índice para busca por usuário
    await queryInterface.addIndex('alerts', ['user_id'], {
      name: 'alerts_user_id_idx'
    });
    
    // Índice para busca por registro
    await queryInterface.addIndex('alerts', ['record_id'], {
      name: 'alerts_record_id_idx'
    });
    
    // Índice para busca por severidade
    await queryInterface.addIndex('alerts', ['severity'], {
      name: 'alerts_severity_idx'
    });
    
    // Índice para alertas não lidos
    await queryInterface.addIndex('alerts', ['is_read'], {
      name: 'alerts_is_read_idx'
    });
    
    // Índice composto para busca eficiente (usuário + não lidos)
    await queryInterface.addIndex('alerts', ['user_id', 'is_read'], {
      name: 'alerts_user_unread_idx'
    });
    
    // Índice para ordenação por data de criação
    await queryInterface.addIndex('alerts', ['created_at'], {
      name: 'alerts_created_at_idx'
    });
  },

  /**
   * Reverte a migração - remove a tabela alerts
   * @param {QueryInterface} queryInterface Interface do Sequelize para queries
   * @param {DataTypes} Sequelize Tipos de dados do Sequelize
   */
  async down(queryInterface, Sequelize) {
    // Remove índices primeiro
    await queryInterface.removeIndex('alerts', 'alerts_created_at_idx');
    await queryInterface.removeIndex('alerts', 'alerts_user_unread_idx');
    await queryInterface.removeIndex('alerts', 'alerts_is_read_idx');
    await queryInterface.removeIndex('alerts', 'alerts_severity_idx');
    await queryInterface.removeIndex('alerts', 'alerts_record_id_idx');
    await queryInterface.removeIndex('alerts', 'alerts_user_id_idx');
    
    // Remove a tabela
    await queryInterface.dropTable('alerts');
  }
};