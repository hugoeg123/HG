/**
 * Configuração do Sequelize para diferentes ambientes
 * 
 * Conector: Usado pelo Sequelize CLI para migrações e seeds
 * Integra com: database-pg.js para conexão com PostgreSQL
 */

require('dotenv').config();

module.exports = {
  development: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'health_guardian',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    dialect: 'postgres',
    logging: console.log
  },
  test: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME + '_test' || 'health_guardian_test',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    dialect: 'postgres',
    logging: false
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  }
};