/**
 * Migração para alterar o campo tipo_dado de TEXT para ENUM
 * 
 * Story 2.1: Estruturação do Modelo de Tag para Dados Tipados e Validação
 * 
 * Conector: Atualiza a estrutura da tabela 'tags' para usar ENUM no campo tipo_dado
 * Integra com: TagDinamica.js model para garantir consistência de tipos
 */

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Verificar se o tipo ENUM já existe antes de criar
    const [results] = await queryInterface.sequelize.query(`
      SELECT 1 FROM pg_type WHERE typname = 'enum_tags_tipo_dado';
    `);

    // Criar o tipo ENUM apenas se não existir
    if (results.length === 0) {
      await queryInterface.sequelize.query(`
        CREATE TYPE enum_tags_tipo_dado AS ENUM (
          'texto',
          'numero', 
          'data',
          'booleano',
          'bp'
        );
      `);
    }

    // Verificar se a coluna já é do tipo ENUM
    const [columnInfo] = await queryInterface.sequelize.query(`
      SELECT data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'tags' AND column_name = 'tipo_dado';
    `);

    // Alterar a coluna apenas se não for ENUM
    if (columnInfo.length > 0 && columnInfo[0].data_type !== 'USER-DEFINED') {
      await queryInterface.sequelize.query(`
        ALTER TABLE tags 
        ALTER COLUMN tipo_dado 
        TYPE enum_tags_tipo_dado 
        USING tipo_dado::enum_tags_tipo_dado;
      `);
    }

    // Verificar se a constraint já existe antes de adicionar
    const [constraintExists] = await queryInterface.sequelize.query(`
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_name = 'tags' AND constraint_name = 'check_regras_validacao_is_object';
    `);

    // Adicionar constraint apenas se não existir
    if (constraintExists.length === 0) {
      await queryInterface.sequelize.query(`
        ALTER TABLE tags 
        ADD CONSTRAINT check_regras_validacao_is_object 
        CHECK (jsonb_typeof(regras_validacao) = 'object');
      `);
    }
  },

  async down(queryInterface, Sequelize) {
    // Remover a constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE tags 
      DROP CONSTRAINT IF EXISTS check_regras_validacao_is_object;
    `);

    // Reverter o campo tipo_dado para TEXT
    await queryInterface.sequelize.query(`
      ALTER TABLE tags 
      ALTER COLUMN tipo_dado 
      TYPE TEXT 
      USING tipo_dado::text;
    `);

    // Remover o tipo ENUM
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_tags_tipo_dado;
    `);
  }
};