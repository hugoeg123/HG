/**
 * Script para configurar o ambiente PostgreSQL
 * 
 * Este script instala as dependências necessárias, configura o PostgreSQL
 * e prepara o ambiente para a migração do MongoDB para o PostgreSQL.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Cores para o console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  bright: '\x1b[1m'
};

// Função para executar comandos com feedback visual
function runCommand(command, message) {
  console.log(`${colors.cyan}${message}...${colors.reset}`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`${colors.green}✓ Concluído com sucesso${colors.reset}\n`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ Falha ao executar: ${error.message}${colors.reset}\n`);
    return false;
  }
}

// Função para criar diretórios se não existirem
function ensureDirectoryExists(dirPath) {
  const directories = dirPath.split(path.sep);
  let currentPath = '';
  
  for (const dir of directories) {
    if (dir) {
      currentPath = currentPath ? path.join(currentPath, dir) : dir;
      if (!fs.existsSync(currentPath)) {
        fs.mkdirSync(currentPath);
        console.log(`${colors.green}Diretório criado: ${currentPath}${colors.reset}`);
      }
    }
  }
}

// Função principal
async function main() {
  console.log(`${colors.bright}${colors.blue}=== Configuração do Ambiente PostgreSQL ===${colors.reset}\n`);
  
  // Verificar se estamos na raiz do projeto backend
  if (!fs.existsSync('package.json')) {
    console.error(`${colors.red}Erro: Execute este script na raiz do projeto backend${colors.reset}`);
    process.exit(1);
  }
  
  // 1. Instalar dependências
  console.log(`${colors.bright}${colors.yellow}Passo 1: Instalando dependências${colors.reset}`);
  if (!runCommand('npm install pg pg-hstore sequelize uuid --save', 'Instalando dependências do PostgreSQL')) {
    process.exit(1);
  }
  
  if (!runCommand('npm install sequelize-cli --save-dev', 'Instalando Sequelize CLI')) {
    process.exit(1);
  }
  
  // 2. Criar estrutura de diretórios
  console.log(`${colors.bright}${colors.yellow}Passo 2: Criando estrutura de diretórios${colors.reset}`);
  
  const directories = [
    'src/models/sequelize',
    'src/migrations',
    'src/seeders',
    'src/config'
  ];
  
  for (const dir of directories) {
    ensureDirectoryExists(dir);
  }
  
  // 3. Configurar PostgreSQL
  console.log(`${colors.bright}${colors.yellow}Passo 3: Configurando PostgreSQL${colors.reset}`);
  
  if (!runCommand('node src/scripts/update-postgresql-config.js', 'Configurando conexão com PostgreSQL')) {
    console.log(`${colors.yellow}Aviso: Você precisará configurar a conexão com o PostgreSQL manualmente${colors.reset}`);
  }
  
  // 4. Executar migrações
  console.log(`${colors.bright}${colors.yellow}Passo 4: Executando migrações${colors.reset}`);
  
  if (!runCommand('npx sequelize-cli db:migrate', 'Criando tabelas no PostgreSQL')) {
    console.log(`${colors.yellow}Aviso: Você precisará executar as migrações manualmente com 'npm run pg:migrate'${colors.reset}`);
  }
  
  // 5. Executar seeders
  console.log(`${colors.bright}${colors.yellow}Passo 5: Populando banco de dados${colors.reset}`);
  
  if (!runCommand('npx sequelize-cli db:seed:all', 'Populando banco de dados com dados iniciais')) {
    console.log(`${colors.yellow}Aviso: Você precisará popular o banco de dados manualmente com 'npm run pg:seed'${colors.reset}`);
  }
  
  // 6. Verificar conexão
  console.log(`${colors.bright}${colors.yellow}Passo 6: Verificando conexão${colors.reset}`);
  
  if (!runCommand('node src/scripts/check-postgresql.js', 'Verificando conexão com PostgreSQL')) {
    console.log(`${colors.yellow}Aviso: Verifique a conexão com o PostgreSQL manualmente com 'npm run pg:check'${colors.reset}`);
  }
  
  // Concluído
  console.log(`${colors.bright}${colors.green}=== Configuração concluída com sucesso ===${colors.reset}\n`);
  console.log(`${colors.cyan}Próximos passos:${colors.reset}`);
  console.log(`1. Execute ${colors.yellow}npm run migrate:mongo-to-pg${colors.reset} para migrar dados do MongoDB para o PostgreSQL`);
  console.log(`2. Modifique ${colors.yellow}src/index.js${colors.reset} para usar o PostgreSQL em vez do MongoDB`);
  console.log(`3. Reinicie o servidor com ${colors.yellow}npm run dev${colors.reset}`);
}

// Executar função principal
main().catch(error => {
  console.error(`${colors.red}Erro não tratado: ${error.message}${colors.reset}`);
  process.exit(1);
});