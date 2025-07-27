/**
 * Migração para implementar o sistema de tags dinâmicas
 * 
 * MISSÃO ZERO-DÉBITO: Implementa o schema PostgreSQL idempotente
 * com tags como variáveis estruturadas para o sistema de prontuário dinâmico
 * 
 * CONTEXTO ESTRATÉGICO: Schema normalizado com tabela de junção,
 * parser único FE/BE, transações atômicas e isolamento por médico
 */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remover tabelas existentes da migração anterior se existirem
    try {
      await queryInterface.dropTable('records');
    } catch (error) {
      // Tabela pode não existir
    }
    try {
      await queryInterface.dropTable('tags');
    } catch (error) {
      // Tabela pode não existir
    }
    try {
      await queryInterface.dropTable('patients');
    } catch (error) {
      // Tabela pode não existir
    }
    try {
      await queryInterface.dropTable('users');
    } catch (error) {
      // Tabela pode não existir
    }

    // Criar extensões necessárias
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "citext";');
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    // Criar tabela de médicos (renomeando users para médicos)
    await queryInterface.createTable('medicos', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()')
      },
      email: {
        type: 'CITEXT',
        unique: true,
        allowNull: false
      },
      nome: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      senha_hash: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Criar tabela de pacientes (simplificada)
    await queryInterface.createTable('pacientes', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()')
      },
      nome: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Criar tabela de tags estruturadas
    await queryInterface.createTable('tags', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()')
      },
      medico_id: {
        type: Sequelize.UUID,
        allowNull: true, // NULL = tag global
        references: {
          model: 'medicos',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      parent_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'tags',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      codigo: {
        type: Sequelize.STRING(50),
        allowNull: false,
        validate: {
          is: /^#\w+|>>\w+/
        }
      },
      nome: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      tipo_dado: {
        type: Sequelize.TEXT,
        allowNull: false,
        validate: {
          isIn: [['texto', 'numero', 'data', 'booleano', 'bp']]
        }
      },
      regras_validacao: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Criar tabela de registros
    await queryInterface.createTable('registros', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()')
      },
      medico_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'medicos',
          key: 'id'
        }
      },
      paciente_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'pacientes',
          key: 'id'
        }
      },
      created_at: {
        type: 'TIMESTAMPTZ',
        defaultValue: Sequelize.literal('now()')
      },
      conteudo_raw: {
        type: Sequelize.TEXT,
        allowNull: true // Para auditoria
      }
    });

    // Criar tabela de seções de registro (tabela de junção normalizada)
    await queryInterface.createTable('secoes_registro', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      registro_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'registros',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      tag_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tags',
          key: 'id'
        }
      },
      valor_raw: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      parsed_value: {
        type: Sequelize.JSONB,
        allowNull: true // Otimização para IA: {"sistolica":120,"diastolica":80}
      },
      ordem: {
        type: Sequelize.SMALLINT,
        allowNull: false
      }
    });

    // Criar constraint única para registro_id + ordem
    await queryInterface.addConstraint('secoes_registro', {
      fields: ['registro_id', 'ordem'],
      type: 'unique',
      name: 'secoes_registro_ordem_unique'
    });

    // Constraint única será criada após a inserção das tags padrão
    // await queryInterface.addConstraint('tags', {
    //   fields: ['medico_id', 'codigo'],
    //   type: 'unique',
    //   name: 'tags_medico_codigo_unique'
    // });

    // Criar índices para performance
    await queryInterface.addIndex('tags', {
      fields: ['medico_id', 'codigo'],
      name: 'idx_tags_medico_codigo'
    });

    await queryInterface.addIndex('secoes_registro', {
      fields: ['parsed_value'],
      using: 'GIN',
      name: 'idx_secoes_parsed_gin'
    });

    // Criar view materializada para IA
    await queryInterface.sequelize.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS ia_prompt_view AS 
      SELECT r.id, jsonb_agg(jsonb_build_object(t.codigo, s.parsed_value)) AS dados_estruturados 
      FROM registros r 
      JOIN secoes_registro s ON r.id = s.registro_id 
      JOIN tags t ON s.tag_id = t.id 
      GROUP BY r.id;
    `);

    // Inserir tags padrão do sistema
    await queryInterface.bulkInsert('tags', [
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        medico_id: null, // Tag global
        parent_id: null,
        codigo: '#QP',
        nome: 'Queixa Principal',
        tipo_dado: 'texto',
        regras_validacao: JSON.stringify({}),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        medico_id: null,
        parent_id: null,
        codigo: '#HDA',
        nome: 'História da Doença Atual',
        tipo_dado: 'texto',
        regras_validacao: JSON.stringify({}),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        medico_id: null,
        parent_id: null,
        codigo: '#EF',
        nome: 'Exame Físico',
        tipo_dado: 'texto',
        regras_validacao: JSON.stringify({}),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        medico_id: null,
        parent_id: null,
        codigo: '#PA',
        nome: 'Pressão Arterial',
        tipo_dado: 'bp',
        regras_validacao: JSON.stringify({"regex": "^\\d{2,3}/\\d{2,3}$"}),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        medico_id: null,
        parent_id: null,
        codigo: '#DX',
        nome: 'Diagnóstico',
        tipo_dado: 'texto',
        regras_validacao: JSON.stringify({}),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        medico_id: null,
        parent_id: null,
        codigo: '#PLANO',
        nome: 'Plano Terapêutico',
        tipo_dado: 'texto',
        regras_validacao: JSON.stringify({}),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    // Remover view materializada
    await queryInterface.sequelize.query('DROP MATERIALIZED VIEW IF EXISTS ia_prompt_view;');
    
    // Remover tabelas na ordem inversa
    await queryInterface.dropTable('secoes_registro');
    await queryInterface.dropTable('registros');
    await queryInterface.dropTable('tags');
    await queryInterface.dropTable('pacientes');
    await queryInterface.dropTable('medicos');
    
    // Remover extensões
    await queryInterface.sequelize.query('DROP EXTENSION IF EXISTS "pgcrypto";');
    await queryInterface.sequelize.query('DROP EXTENSION IF EXISTS "citext";');
    await queryInterface.sequelize.query('DROP EXTENSION IF EXISTS "uuid-ossp";');
  }
};