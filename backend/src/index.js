/**
 * Arquivo principal do servidor backend
 * 
 * Inicializa o servidor Express, conecta ao PostgreSQL e configura middlewares e rotas
 * 
 * Conector: Ponto de entrada da aplicação, integra todos os módulos do backend
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const agendaRoutes = require('./routes/agenda.routes');

// Carregar variáveis de ambiente
dotenv.config();

// Importar rotas
const authRoutes = require('./routes/auth.routes');
const patientRoutes = require('./routes/patient.routes');
const recordRoutes = require('./routes/record.routes');
const tagRoutes = require('./routes/tag.routes');
const calculatorRoutes = require('./routes/calculator.routes');
const alertRoutes = require('./routes/alert.routes');
const templateRoutes = require('./routes/template.routes');
const aiRoutes = require('./routes/ai.routes');
const exportRoutes = require('./routes/export.routes');
const patientInputRoutes = require('./routes/patient-input.routes');

// Importar middleware de erro
const { errorHandler } = require('./middleware/error.middleware');

// Inicializar app Express
const app = express();
const server = http.createServer(app);

// Configurar Socket.io
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? 'https://health-guardian.com' 
      : ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://health-guardian.com' 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/calculators', calculatorRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/agenda', agendaRoutes);
app.use('/api/patient-inputs', patientInputRoutes);

// Rota de saúde
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Servidor funcionando corretamente' });
});

// Middleware de tratamento de erros
app.use(errorHandler);

// Configurar Socket.io para atualizações em tempo real
require('./services/socket.service')(io);

// Importar configuração do banco de dados PostgreSQL
const { sequelize } = require('./config/database-pg');

// Conectar ao PostgreSQL e iniciar servidor
async function startServer() {
  try {
    // Conectar ao PostgreSQL
    await sequelize.authenticate();
    console.log('PostgreSQL conectado com sucesso');
    
    // Iniciar servidor
    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT} usando PostgreSQL`);
    });
  } catch (err) {
    console.error('Erro ao conectar ao PostgreSQL:', err.message);
    console.error('⚠️ Iniciando servidor sem banco de dados (modo degradado).');

    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT} (DB offline)`);
    });
  }
}

// Iniciar servidor
startServer();

// Tratamento de erros não capturados
process.on('unhandledRejection', (err) => {
  console.error('Erro não tratado:', err);
  // Não encerra o servidor, apenas registra o erro
});

module.exports = { app, server };