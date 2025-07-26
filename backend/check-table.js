const { sequelize } = require('./src/config/database-pg');

async function checkTable() {
  try {
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Colunas da tabela users:');
    results.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    await sequelize.close();
  } catch (error) {
    console.error('Erro ao verificar tabela:', error);
  }
}

checkTable();