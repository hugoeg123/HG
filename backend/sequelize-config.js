/**
 * Configuração do Sequelize para PostgreSQL
 * 
 * Este arquivo configura o Sequelize ORM para trabalhar com PostgreSQL
 * 
 * Conector: Integra com o sistema de banco de dados PostgreSQL e é usado pelos modelos Sequelize
 */

require('dotenv').config();

module.exports = {
  development: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    dialectOptions: {
      ssl: false
    },
    define: {
      timestamps: true,
      underscored: false,
      underscoredAll: false,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt'
    },
    logging: console.log
  },
  test: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/health-guardian-test',
    dialect: 'postgres',
    dialectOptions: {
      ssl: false
    },
    define: {
      timestamps: true,
      underscored: false,
      underscoredAll: false,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt'
    },
    logging: false
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    define: {
      timestamps: true,
      underscored: false,
      underscoredAll: false,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt'
    },
    logging: false
  }
};