/**
 * Migração inicial para criar todas as tabelas no PostgreSQL
 * 
 * Este arquivo define a estrutura das tabelas para o PostgreSQL
 * 
 * Conector: Usado pelo Sequelize CLI para criar as tabelas no banco de dados
 */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Criar tabela de usuários
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      isAdmin: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Criar tabela de pacientes
    await queryInterface.createTable('patients', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      dateOfBirth: {
        type: Sequelize.DATE,
        allowNull: false
      },
      gender: {
        type: Sequelize.ENUM('masculino', 'feminino', 'outro', 'não informado'),
        defaultValue: 'não informado'
      },
      cpf: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      emergencyContactName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      emergencyContactPhone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      emergencyContactRelationship: {
        type: Sequelize.STRING,
        allowNull: true
      },
      street: {
        type: Sequelize.STRING,
        allowNull: true
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true
      },
      state: {
        type: Sequelize.STRING,
        allowNull: true
      },
      zipCode: {
        type: Sequelize.STRING,
        allowNull: true
      },
      country: {
        type: Sequelize.STRING,
        defaultValue: 'Brasil',
        allowNull: true
      },
      bloodType: {
        type: Sequelize.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Desconhecido'),
        defaultValue: 'Desconhecido'
      },
      allergies: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      chronicConditions: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      medications: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      familyHistory: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Criar tabela de tags
    await queryInterface.createTable('tags', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      color: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: '#3B82F6'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Criar tabela de registros
    await queryInterface.createTable('records', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      patientId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'patients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      tags: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      attachments: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      updatedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      isDeleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Criar índices para melhorar a performance
    await queryInterface.addIndex('patients', ['name']);
    await queryInterface.addIndex('patients', ['cpf']);
    await queryInterface.addIndex('records', ['patientId', 'date']);
    await queryInterface.addIndex('records', ['patientId', 'type']);
    await queryInterface.addIndex('tags', ['name']);

    // Criar extensão para pesquisa de texto completo
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
    
    // Criar índice GIN para pesquisa de texto em registros
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS records_content_gin_idx ON records USING GIN (content gin_trgm_ops);'
    );
  },

  down: async (queryInterface, Sequelize) => {
    // Remover tabelas na ordem inversa para evitar problemas com chaves estrangeiras
    await queryInterface.dropTable('records');
    await queryInterface.dropTable('tags');
    await queryInterface.dropTable('patients');
    await queryInterface.dropTable('users');
    
    // Remover extensão
    await queryInterface.sequelize.query('DROP EXTENSION IF EXISTS pg_trgm;');
  }
};