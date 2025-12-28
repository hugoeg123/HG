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
const logger = require('./utils/logger');

// Criar aplicação Express
const app = express();

const DEBUG_HTTP = process.env.DEBUG_HTTP === 'true';
const DEBUG_CORS = process.env.DEBUG_CORS === 'true';

// Configurações de segurança
// Ajuste: permitir carregamento de imagens e arquivos de uploads a partir de outra origem
// Motivo: evitar bloqueio "net::ERR_BLOCKED_BY_RESPONSE.NotSameOrigin" causado por CORP padrão do Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      // Em desenvolvimento permitimos http e https para imagens
      imgSrc: ["'self'", "data:", "https:", "http:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  // Permitir que recursos (como imagens) sejam incorporados por outras origens (frontend em outra porta)
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configurado para desenvolvimento e produção
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
  'http://localhost:3005',
  'http://localhost:5173', // Vite default port
  'http://localhost:5174', // Vite alternative port
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
  'http://127.0.0.1:3003',
  'http://127.0.0.1:3004',
  'http://127.0.0.1:3005',
  'http://127.0.0.1:5173'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Durante desenvolvimento, permitir todas as origens
    // Em produção, usar a lista allowedOrigins
    if (process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Handler explícito para preflight requests (OPTIONS)
// Connector: Ensures CORS preflight requests are handled correctly
app.options('*', cors(corsOptions));

// Compressão de respostas
app.use(compression({
  filter: (req, res) => {
    if (req.originalUrl && req.originalUrl.startsWith('/api/ai/chat')) return false;
    return compression.filter(req, res);
  }
}));

// Rate limiting configurado por ambiente
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Rate limiting geral - muito permissivo em desenvolvimento
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: isDevelopment ? 100000 : 100, // Extremamente permissivo em dev
  message: {
    error: 'Muitas tentativas. Tente novamente em 15 minutos.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting completely for development
  skip: (req) => {
    if (isDevelopment) {
      return true; // Skip all rate limiting in development
    }
    return false;
  }
});

if (!isTest) {
  app.use('/api', limiter);
}

// Rate limiting para autenticação - desabilitado em desenvolvimento
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: isDevelopment ? 100000 : 5, // Sem limite em dev, 5 tentativas em prod
  message: {
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  skipSuccessfulRequests: true,
  // Skip rate limiting completely for development
  skip: (req) => {
    if (isDevelopment) {
      return true; // Skip all auth rate limiting in development
    }
    return false;
  }
});

if (!isTest) {
  app.use('/api/auth/login', authLimiter);
}

// Parsing de JSON e URL-encoded
app.use(express.json({
  limit: '10mb',
  strict: true
}));

app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));

// Servir arquivos estáticos da pasta uploads
// Conector: Permite acesso direto aos arquivos enviados via /uploads/
// Também reforça cabeçalho CORP para evitar bloqueios de incorporação cross-origin
app.use(
  '/uploads',
  express.static('uploads', {
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      // Opcional: facilita testes em desenvolvimento
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  })
);

// Middleware de logging para desenvolvimento
if (process.env.NODE_ENV === 'development' && DEBUG_HTTP) {
  app.use((req, res, next) => {
    const start = Date.now();

    // Log detalhado para requisições CORS e OPTIONS (condicional)
    if (DEBUG_CORS && (req.method === 'OPTIONS' || req.originalUrl.includes('/auth/'))) {
      logger.debug(`[CORS-DEBUG] ${req.method} ${req.originalUrl}`);
      logger.debug(`[CORS-DEBUG] Origin: ${req.headers.origin}`);
      logger.debug(`[CORS-DEBUG] Headers: ${JSON.stringify(req.headers)}`);
    }

    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.http(`${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);

      // Log adicional para respostas CORS (condicional)
      if (DEBUG_CORS && (req.method === 'OPTIONS' || req.originalUrl.includes('/auth/'))) {
        logger.debug(`[CORS-DEBUG] Response Headers: ${JSON.stringify(res.getHeaders())}`);
      }
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
  logger.error('Erro não tratado:', error);

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
    // Testar conexão com banco de dados (timeout de 5s)
    const authPromise = sequelize.authenticate();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout na conexão com o banco de dados')), 5000)
    );
    
    await Promise.race([authPromise, timeoutPromise]);
    logger.info('✅ Conexão com PostgreSQL estabelecida');
    global.isDbOffline = false;

    // Sincronizar modelos (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      logger.info('✅ Modelos sincronizados com o banco');
    }
    
    const PORT = process.env.PORT || 5001;

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
          'http://localhost:5173', // Vite default port
          'http://localhost:5174', // Vite alternative port
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001',
          'http://127.0.0.1:3002',
          'http://127.0.0.1:3003',
          'http://127.0.0.1:3004',
          'http://127.0.0.1:3005',
          'http://127.0.0.1:5173',
          'http://127.0.0.1:5174'
        ],
        credentials: true
      }
    });

    // Configurar serviços do Socket.io
    const socketService = require('./services/socket.service')(io);
    // Expor serviço via registro para uso em controladores
    // Connector: controllers podem obter sendToUser/broadcast sem importar io
    const { setSocketService } = require('./services/socket.registry');
    setSocketService(socketService);

    server.listen(PORT, () => {
      logger.info(`🚀 Servidor rodando na porta ${PORT}`);
      logger.info(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 API: http://localhost:${PORT}/api`);
      logger.info(`❤️  Health: http://localhost:${PORT}/api/health`);
      logger.info(`🔌 Socket.io configurado e ativo`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`\n🛑 Recebido sinal ${signal}. Iniciando shutdown graceful...`);

      server.close(async () => {
        logger.info('🔌 Servidor HTTP fechado');

        try {
          await sequelize.close();
          logger.info('🔌 Conexão com banco fechada');
          process.exit(0);
        } catch (error) {
          logger.error('❌ Erro ao fechar conexão com banco:', error);
          process.exit(1);
        }
      });

      // Forçar shutdown após 10 segundos
      setTimeout(() => {
        logger.error('⏰ Forçando shutdown após timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('❌ Erro ao inicializar servidor:', error);
    logger.warn('⚠️ Iniciando servidor sem banco de dados (modo degradado).');
    global.isDbOffline = true;

    const PORT = process.env.PORT || 5001;
    const server = createServer(app);

    server.listen(PORT, () => {
      logger.info(`🚀 Servidor rodando na porta ${PORT} (DB offline)`);
      logger.info(`🔗 API: http://localhost:${PORT}/api`);
      logger.info(`❤️  Health: http://localhost:${PORT}/api/health`);
    });
  }
};

// Inicializar apenas se este arquivo for executado diretamente
if (require.main === module) {
  startServer();
}

module.exports = app;
