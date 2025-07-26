/**
 * Health Guardian - Backend API
 * 
 * MISSÃO ZERO-DÉBITO: Sistema de registros médicos com tags dinâmicas
 * Aplicação Express.js com autenticação JWT e banco PostgreSQL
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Importar rotas e middlewares
const apiRoutes = require('./routes');
const { sequelize } = require('./models/sequelize');

// Criar aplicação Express
const app = express();

// Configurações de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configurado para desenvolvimento e produção
const corsOptions = {
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Compressão de respostas
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // requests por IP
  message: {
    error: 'Muitas tentativas. Tente novamente em 15 minutos.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api', limiter);

// Rate limiting mais restritivo para autenticação
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas de login por IP
  message: {
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  skipSuccessfulRequests: true
});

app.use('/api/auth/login', authLimiter);

// Parsing de JSON e URL-encoded
app.use(express.json({ 
  limit: '10mb',
  strict: true
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Middleware de logging para desenvolvimento
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    });
    next();
  });
}

// Health check básico
app.get('/', (req, res) => {
  res.json({
    name: 'Health Guardian API',
    version: process.env.npm_package_version || '1.0.0',
    status: 'online',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Registrar rotas da API
app.use('/api', apiRoutes);

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Middleware global de tratamento de erros
app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  
  // Erro de CORS
  if (error.message === 'Não permitido pelo CORS') {
    return res.status(403).json({
      error: 'Acesso negado pelo CORS',
      code: 'CORS_ERROR'
    });
  }
  
  // Erro de payload muito grande
  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Payload muito grande',
      code: 'PAYLOAD_TOO_LARGE',
      limit: '10MB'
    });
  }
  
  // Erro de JSON malformado
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      error: 'JSON inválido',
      code: 'INVALID_JSON',
      details: 'Verifique a sintaxe do JSON enviado'
    });
  }
  
  // Erro genérico
  res.status(500).json({
    error: 'Erro interno do servidor',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && {
      details: error.message,
      stack: error.stack
    })
  });
});

// Função para inicializar o servidor
const startServer = async () => {
  try {
    // Testar conexão com banco de dados
    await sequelize.authenticate();
    console.log('✅ Conexão com PostgreSQL estabelecida');
    
    // Sincronizar modelos (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      console.log('✅ Modelos sincronizados com o banco');
    }
    
    const PORT = process.env.PORT || 5000;
    
    // Criar servidor HTTP
    const server = createServer(app);
    
    // Configurar Socket.io
    const io = new Server(server, {
      cors: {
        origin: [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:3002',
          'http://localhost:3003',
          'http://localhost:3004',
          'http://localhost:3005',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001',
          'http://127.0.0.1:3002',
          'http://127.0.0.1:3003',
          'http://127.0.0.1:3004',
          'http://127.0.0.1:3005'
        ],
        credentials: true
      }
    });
    
    // Configurar serviços do Socket.io
    const socketService = require('./services/socket.service')(io);
    
    server.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API: http://localhost:${PORT}/api`);
      console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
      console.log(`🔌 Socket.io configurado e ativo`);
      console.log(`⚡ Servidor reiniciado com sucesso!`);
    });
    
    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Recebido sinal ${signal}. Iniciando shutdown graceful...`);
      
      server.close(async () => {
        console.log('🔌 Servidor HTTP fechado');
        
        try {
          await sequelize.close();
          console.log('🔌 Conexão com banco fechada');
          process.exit(0);
        } catch (error) {
          console.error('❌ Erro ao fechar conexão com banco:', error);
          process.exit(1);
        }
      });
      
      // Forçar shutdown após 10 segundos
      setTimeout(() => {
        console.log('⏰ Forçando shutdown após timeout');
        process.exit(1);
      }, 10000);
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('❌ Erro ao inicializar servidor:', error);
    process.exit(1);
  }
};

// Inicializar apenas se este arquivo for executado diretamente
if (require.main === module) {
  startServer();
}

module.exports = app;