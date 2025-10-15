/**
 * Script de migração para adicionar campos de perfil profissional
 * 
 * Executa as alterações na tabela medicos para suportar perfil profissional
 */

const { sequelize } = require('../src/config/database-pg');

async function migrateProfileFields() {
  try {
    console.log('🔄 Iniciando migração de campos de perfil...');
    
    // Adicionar colunas se não existirem
    await sequelize.query(`
      ALTER TABLE medicos 
      ADD COLUMN IF NOT EXISTS titulo_profissional VARCHAR(100);
    `);
    console.log('✅ Coluna titulo_profissional adicionada');
    
    await sequelize.query(`
      ALTER TABLE medicos 
      ADD COLUMN IF NOT EXISTS biografia TEXT;
    `);
    console.log('✅ Coluna biografia adicionada');
    
    await sequelize.query(`
      ALTER TABLE medicos 
      ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
    `);
    console.log('✅ Coluna avatar_url adicionada');
    
    await sequelize.query(`
      ALTER TABLE medicos 
      ADD COLUMN IF NOT EXISTS curriculo_url VARCHAR(500);
    `);
    console.log('✅ Coluna curriculo_url adicionada');
    
    // Adicionar comentários
    await sequelize.query(`
      COMMENT ON COLUMN medicos.titulo_profissional IS 'Título profissional do médico (ex: Cardiologista, Clínico Geral)';
    `);
    
    await sequelize.query(`
      COMMENT ON COLUMN medicos.biografia IS 'Biografia/apresentação profissional do médico';
    `);
    
    await sequelize.query(`
      COMMENT ON COLUMN medicos.avatar_url IS 'URL da foto de perfil do médico';
    `);
    
    await sequelize.query(`
      COMMENT ON COLUMN medicos.curriculo_url IS 'URL do currículo em PDF do médico';
    `);
    
    console.log('✅ Comentários adicionados');
    console.log('🎉 Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Executar migração
if (require.main === module) {
  migrateProfileFields()
    .then(() => {
      console.log('✅ Script executado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Falha na execução:', error);
      process.exit(1);
    });
}

module.exports = migrateProfileFields;