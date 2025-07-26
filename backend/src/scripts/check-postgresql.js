/**
 * Script para verificar a conexão com o PostgreSQL
 * 
 * Conector: Integra com o sistema de banco de dados PostgreSQL
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { Client } = require('pg');

// Cores para console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

/**
 * Imprime mensagens coloridas no console
 * @param {string} message - Mensagem a ser exibida
 * @param {string} color - Cor da mensagem (reset, red, green, yellow, blue)
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Verificar se o arquivo .env existe
const envPath = path.join(__dirname, '..', '..', '.env');
if (!fs.existsSync(envPath)) {
  log(`❌ Arquivo .env não encontrado em: ${envPath}`, 'red');
  process.exit(1);
}

// Ler o arquivo .env para obter as configurações do PostgreSQL
const envContent = fs.readFileSync(envPath, 'utf8');

// Extrair as configurações do PostgreSQL do arquivo .env
const dbHost = envContent.match(/DB_HOST=(.+)/i)?.[1]?.trim() || 'localhost';
const dbPort = envContent.match(/DB_PORT=(.+)/i)?.[1]?.trim() || '5432';
const dbName = envContent.match(/DB_NAME=(.+)/i)?.[1]?.trim() || 'health_guardian';
const dbUser = envContent.match(/DB_USER=(.+)/i)?.[1]?.trim() || 'postgres';
const dbPassword = envContent.match(/DB_PASSWORD=(.+)/i)?.[1]?.trim() || 'postgres';

// Construir a URL de conexão do PostgreSQL
const pgUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
log(`🔍 URL do PostgreSQL: ${pgUrl}`, 'blue');

// Verificar se o Docker está em execução
log('🔍 Verificando se o Docker está em execução...', 'blue');
exec('docker info', (error) => {
  if (error) {
    log('❌ Docker não está em execução ou não está instalado', 'red');
    log('\nSoluções:', 'blue');
    log('1. Instale o Docker Desktop: https://www.docker.com/products/docker-desktop', 'blue');
    log('2. Inicie o Docker Desktop', 'blue');
    log('3. Execute o script start-dev-with-data.ps1 novamente', 'blue');
    process.exit(1);
  }
  
  // Verificar se o contêiner do PostgreSQL está em execução
  log('🔍 Verificando se o contêiner do PostgreSQL está em execução...', 'blue');
  exec('docker ps --filter "name=postgres"', (error, stdout) => {
    if (error) {
      log('❌ Erro ao verificar contêineres Docker', 'red');
      process.exit(1);
    }
    
    if (!stdout.includes('postgres')) {
      log('❌ Contêiner do PostgreSQL não está em execução', 'red');
      log('\nSoluções:', 'blue');
      log('1. Inicie o PostgreSQL com: docker-compose up -d postgres', 'blue');
      log('2. Ou execute o script start-dev-with-data.ps1', 'blue');
      process.exit(1);
    }
    
    log('✅ Contêiner do PostgreSQL está em execução', 'green');
    
    // Verificar se o backend pode se conectar ao PostgreSQL
    log('🔍 Verificando se o backend pode se conectar ao PostgreSQL...', 'blue');
    
    // Criar um cliente PostgreSQL
    const client = new Client({
      host: dbHost,
      port: dbPort,
      database: dbName,
      user: dbUser,
      password: dbPassword
    });
    
    // Tentar conectar ao PostgreSQL
    client.connect()
      .then(() => {
        log('✅ Conexão com PostgreSQL estabelecida com sucesso!', 'green');
        // Executar uma consulta simples para verificar a conexão
        return client.query('SELECT version()');
      })
      .then(res => {
        log(`✅ Versão do PostgreSQL: ${res.rows[0].version}`, 'green');
        client.end();
        process.exit(0);
      })
      .catch(err => {
        log('❌ Erro ao conectar com PostgreSQL', 'red');
        log(err.message, 'red');
        log('\nPossíveis causas:', 'yellow');
        log('1. O PostgreSQL não está aceitando conexões', 'yellow');
        log('2. A URL de conexão está incorreta', 'yellow');
        log('3. Problemas de rede ou firewall', 'yellow');
        
        log('\nSoluções:', 'blue');
        log('1. Verifique se o PostgreSQL está em execução: docker ps', 'blue');
        log('2. Reinicie o contêiner: docker-compose restart postgres', 'blue');
        log('3. Verifique o arquivo .env e a URL de conexão', 'blue');
        
        if (client) client.end();
        process.exit(1);
      });
  });
});