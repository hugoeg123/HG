/**
 * Configuração do banco de dados PostgreSQL
 * 
 * Centraliza a configuração de conexão com o PostgreSQL usando Sequelize
 * 
 * Conector: Integra com o sistema de banco de dados PostgreSQL e é usado pelos modelos Sequelize
 */

const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

// Verificar se as variáveis do banco de dados estão definidas
if (!process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_USER) {
  console.error('Erro: Variáveis de banco de dados (DB_HOST, DB_NAME, DB_USER) não estão definidas no arquivo .env');
  process.exit(1);
}

// Opções de conexão
const options = {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: false,
    underscoredAll: false,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
};

// Adicionar opções SSL para ambiente de produção
if (process.env.NODE_ENV === 'production') {
  options.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  };
}

// Criar instância do Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    ...options
  }
);

/**
 * Conecta ao banco de dados PostgreSQL
 * @returns {Promise<Sequelize>} Instância do Sequelize conectada
 */
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`PostgreSQL conectado: ${sequelize.options.host}`);
    return sequelize;
  } catch (error) {
    console.error(`Erro ao conectar ao PostgreSQL: ${error.message}`);
    throw error;
  }
};

module.exports = { sequelize, connectDB };