/**
 * Controlador de upload de arquivos
 * 
 * Gerencia upload de avatares e currículos com validação de tipos
 * 
 * Conector: Integra com routes/file.routes.js e middleware multer
 * IA prompt: Expandir para suporte a outros tipos de arquivos médicos
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuração de armazenamento em memória
const storage = multer.memoryStorage();

// Validação de tipos de arquivo
const fileFilter = (req, file, cb) => {
  const { fieldname } = file;
  
  if (fieldname === 'avatar') {
    // Aceitar apenas imagens para avatar
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo inválido para avatar. Aceitos: JPEG, PNG, WebP'), false);
    }
  } else if (fieldname === 'curriculo') {
    // Aceitar PDF e documentos para currículo
    const allowedDocTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedDocTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo inválido para currículo. Aceitos: PDF, DOC, DOCX'), false);
    }
  } else {
    cb(new Error('Campo de arquivo não reconhecido'), false);
  }
};

// Configuração do multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  }
});

// Middleware para upload de múltiplos campos
exports.uploadMiddleware = upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'curriculo', maxCount: 1 }
]);

/**
 * Upload de arquivos
 * 
 * Hook: Chamado de routes/file.routes.js após validação
 * Conector: Salva arquivos e retorna URLs para frontend
 */
exports.uploadFiles = async (req, res) => {
  try {
    const uploadedFiles = {};
    const configuredBase = process.env.PUBLIC_BASE_URL;
    const baseUrl = (configuredBase && configuredBase.trim().length > 0)
      ? configuredBase.replace(/\/+$/, '')
      : `${req.protocol}://${req.get('host')}`;
    
    // Criar diretório de uploads se não existir
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Criar subdiretórios
    const avatarsDir = path.join(uploadsDir, 'avatars');
    const curriculosDir = path.join(uploadsDir, 'curriculos');
    
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
    }
    if (!fs.existsSync(curriculosDir)) {
      fs.mkdirSync(curriculosDir, { recursive: true });
    }
    
    // Processar avatar
    if (req.files && req.files.avatar) {
      const avatarFile = req.files.avatar[0];
      const timestamp = Date.now();
      const extension = path.extname(avatarFile.originalname);
      const filename = `avatar_${req.user.sub}_${timestamp}${extension}`;
      const filepath = path.join(avatarsDir, filename);
      
      // Salvar arquivo
      fs.writeFileSync(filepath, avatarFile.buffer);
      
      uploadedFiles.avatar_url = `${baseUrl}/uploads/avatars/${filename}`;
    }
    
    // Processar currículo
    if (req.files && req.files.curriculo) {
      const curriculoFile = req.files.curriculo[0];
      const timestamp = Date.now();
      const extension = path.extname(curriculoFile.originalname);
      const filename = `curriculo_${req.user.sub}_${timestamp}${extension}`;
      const filepath = path.join(curriculosDir, filename);
      
      // Salvar arquivo
      fs.writeFileSync(filepath, curriculoFile.buffer);
      
      uploadedFiles.curriculo_url = `${baseUrl}/uploads/curriculos/${filename}`;
    }
    
    if (Object.keys(uploadedFiles).length === 0) {
      return res.status(400).json({ 
        message: 'Nenhum arquivo válido foi enviado' 
      });
    }
    
    res.json({
      message: 'Arquivos enviados com sucesso',
      files: uploadedFiles
    });
    
  } catch (error) {
    console.error('Erro no upload de arquivos:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
};

/**
 * Middleware de tratamento de erros do multer
 * 
 * Hook: Captura erros de validação de arquivo
 */
exports.handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'Arquivo muito grande. Tamanho máximo: 5MB' 
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        message: 'Campo de arquivo inesperado' 
      });
    }
  }
  
  if (error.message.includes('Tipo de arquivo inválido')) {
    return res.status(400).json({ 
      message: error.message 
    });
  }
  
  next(error);
};