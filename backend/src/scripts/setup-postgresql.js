/**
 * Script para configurar o banco de dados PostgreSQL
 * 
 * Este script executa as migrações e popula o banco de dados com dados iniciais
 * 
 * Conector: Usado para inicializar o banco de dados PostgreSQL
 */

require('dotenv').config();
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { sequelize } = require('../config/database-pg');

// Cores para o console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

/**
 * Executa um comando e retorna a saída
 * @param {string} command - Comando a ser executado
 * @returns {string} Saída do comando
 */
function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    console.error(`${colors.red}Erro ao executar comando: ${command}${colors.reset}`);
    console.error(error.message);
    return null;
  }
}

/**
 * Verifica se o PostgreSQL está acessível
 * @returns {Promise<boolean>} Verdadeiro se o PostgreSQL estiver acessível
 */
async function checkPostgresConnection() {
  try {
    await sequelize.authenticate();
    console.log(`${colors.green}Conexão com PostgreSQL estabelecida com sucesso.${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}Não foi possível conectar ao PostgreSQL: ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Executa as migrações do Sequelize
 */
function runMigrations() {
  console.log(`${colors.cyan}Executando migrações...${colors.reset}`);
  const result = runCommand('npx sequelize-cli db:migrate');
  if (result) {
    console.log(`${colors.green}Migrações executadas com sucesso.${colors.reset}`);
    return true;
  }
  return false;
}

/**
 * Popula o banco de dados com dados iniciais
 */
function seedDatabase() {
  console.log(`${colors.cyan}Populando banco de dados...${colors.reset}`);
  const result = runCommand('npx sequelize-cli db:seed:all');
  if (result) {
    console.log(`${colors.green}Banco de dados populado com sucesso.${colors.reset}`);
    return true;
  }
  return false;
}

/**
 * Função principal
 */
async function main() {
  console.log(`${colors.bright}${colors.blue}=== Configuração do PostgreSQL ===${colors.reset}`);
  
  // Verificar conexão com PostgreSQL
  const isConnected = await checkPostgresConnection();
  if (!isConnected) {
    console.error(`${colors.red}Não foi possível conectar ao PostgreSQL. Verifique se:${colors.reset}`);
    console.error(`${colors.yellow}1. O PostgreSQL está em execução${colors.reset}`);
    console.error(`${colors.yellow}2. A variável DATABASE_URL no arquivo .env está correta${colors.reset}`);
    console.error(`${colors.yellow}3. Execute o script update-postgresql-config.js para configurar a conexão${colors.reset}`);
    process.exit(1);
  }
  
  // Executar migrações
  const migrationsSuccess = runMigrations();
  if (!migrationsSuccess) {
    console.error(`${colors.red}Falha ao executar migrações.${colors.reset}`);
    process.exit(1);
  }
  
  // Popular banco de dados
  const seedSuccess = seedDatabase();
  if (!seedSuccess) {
    console.error(`${colors.red}Falha ao popular banco de dados.${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`${colors.bright}${colors.green}PostgreSQL configurado com sucesso!${colors.reset}`);
  console.log(`${colors.cyan}Você pode iniciar o servidor com: npm run dev${colors.reset}`);
  
  // Fechar conexão
  await sequelize.close();
}

// Executar função principal
main().catch(error => {
  console.error(`${colors.red}Erro durante a configuração: ${error.message}${colors.reset}`);
  process.exit(1);
});