/**
 * Controlador de alertas
 * 
 * Gerencia operações CRUD para alertas e funcionalidades específicas
 * 
 * Conector: Integra com services/alert.service.js para lógica de negócio
 */

const { validationResult } = require('express-validator');
const alertService = require('../services/alert.service');

/**
 * Lista todos os alertas do usuário autenticado
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
exports.list = async (req, res) => {
  try {
    console.log('ALERT_LIST_REQUEST_USER', { id: req.user?.sub, role: req.user?.role });
    
    // Verificar se o usuário está autenticado
    if (!req.user || !req.user.sub) {
      return res.status(401).json({ 
        message: 'Usuário não autenticado',
        code: 'NO_AUTH'
      });
    }

    // Opções de filtro da query
    const filters = {
      severity: req.query.severity,
      unread: req.query.unread === 'true',
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };

    console.log('ALERT_LIST_FILTERS', filters);
    
    // Buscar alertas usando o serviço
    let alerts = await alertService.getAlerts(req.user.sub, filters);

    // Fallback: gerar alertas derivados de registros recentes caso não haja persistidos
    if (!alerts || alerts.length === 0) {
      try {
        const { Record } = require('../models');
        const recentRecords = await Record.findAll({
          where: { createdBy: req.user.sub },
          order: [['date', 'DESC']],
          limit: 20
        });

        const { extractVitals, calculateAlerts } = require('../utils/vitalSignParser');
        const derived = [];
        for (const r of recentRecords) {
          const vitals = extractVitals(r.content || '');
          const al = calculateAlerts(vitals);
          for (const def of al) {
            derived.push({
              id: `ephem_${r.id}_${def.key || def.type}`,
              user_id: req.user.sub,
              record_id: r.id,
              message: def.message,
              severity: def.type,
              is_read: false,
              read_at: null,
              created_at: r.date || new Date()
            });
          }
        }

        alerts = derived;
        console.log('ALERT_LIST_FALLBACK_DERIVED', { count: derived.length });
      } catch (fallbackErr) {
        console.error('ALERT_LIST_FALLBACK_ERROR', { error: fallbackErr.message });
      }
    }

    console.log('ALERT_LIST_RESULT_COUNT', { count: alerts.length });
    
    res.json({
      alerts,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        total: alerts.length
      }
    });
  } catch (error) {
    console.error('Erro ao listar alertas:', error);
    res.status(500).json({ 
      message: 'Erro ao listar alertas',
      error: error.message 
    });
  }
};

/**
 * Obtém um alerta específico por ID
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.user || !req.user.sub) {
      return res.status(401).json({ 
        message: 'Usuário não autenticado',
        code: 'NO_AUTH'
      });
    }

    const alert = await alertService.getAlertById(id, req.user.sub);
    
    res.json(alert);
  } catch (error) {
    console.error('Erro ao buscar alerta:', error);
    
    if (error.message === 'Alerta não encontrado') {
      return res.status(404).json({ message: error.message });
    }
    
    res.status(500).json({ 
      message: 'Erro ao buscar alerta',
      error: error.message 
    });
  }
};

/**
 * Cria um novo alerta
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
exports.create = async (req, res) => {
  try {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    if (!req.user || !req.user.sub) {
      return res.status(401).json({ 
        message: 'Usuário não autenticado',
        code: 'NO_AUTH'
      });
    }

    // Criar alerta usando o serviço
    const alertData = {
      ...req.body,
      user_id: req.user.sub
    };
    
    const alert = await alertService.createAlert(alertData);
    
    res.status(201).json(alert);
  } catch (error) {
    console.error('Erro ao criar alerta:', error);
    res.status(500).json({ 
      message: 'Erro ao criar alerta',
      error: error.message 
    });
  }
};

/**
 * Marca um alerta como lido
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.user || !req.user.sub) {
      return res.status(401).json({ 
        message: 'Usuário não autenticado',
        code: 'NO_AUTH'
      });
    }

    // No-op for efêmeros
    if (id && id.startsWith('ephem_')) {
      return res.json({
        message: 'Alerta efêmero marcado como lido',
        alert: { id, is_read: true }
      });
    }

    const alert = await alertService.markAsRead(id, req.user.sub);
    
    res.json({
      message: 'Alerta marcado como lido',
      alert
    });
  } catch (error) {
    console.error('Erro ao marcar alerta como lido:', error);
    
    if (error.message === 'Alerta não encontrado') {
      return res.status(404).json({ message: error.message });
    }
    
    res.status(500).json({ 
      message: 'Erro ao marcar alerta como lido',
      error: error.message 
    });
  }
};

/**
 * Marca todos os alertas do usuário como lidos
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
exports.markAllAsRead = async (req, res) => {
  try {
    if (!req.user || !req.user.sub) {
      return res.status(401).json({ 
        message: 'Usuário não autenticado',
        code: 'NO_AUTH'
      });
    }

    const updatedCount = await alertService.markAllAsRead(req.user.sub);
    
    res.json({
      message: `${updatedCount} alertas marcados como lidos`,
      updatedCount
    });
  } catch (error) {
    console.error('Erro ao marcar todos os alertas como lidos:', error);
    res.status(500).json({ 
      message: 'Erro ao marcar todos os alertas como lidos',
      error: error.message 
    });
  }
};

/**
 * Deleta um alerta
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.user || !req.user.sub) {
      return res.status(401).json({ 
        message: 'Usuário não autenticado',
        code: 'NO_AUTH'
      });
    }

    await alertService.deleteAlert(id, req.user.sub);
    
    res.json({
      message: 'Alerta deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar alerta:', error);
    
    if (error.message === 'Alerta não encontrado') {
      return res.status(404).json({ message: error.message });
    }
    
    res.status(500).json({ 
      message: 'Erro ao deletar alerta',
      error: error.message 
    });
  }
};

/**
 * Obtém contagem de alertas não lidos
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
exports.getUnreadCount = async (req, res) => {
  try {
    if (!req.user || !req.user.sub) {
      return res.status(401).json({ 
        message: 'Usuário não autenticado',
        code: 'NO_AUTH'
      });
    }

    const count = await alertService.getUnreadCount(req.user.sub);
    
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Erro ao contar alertas não lidos:', error);
    res.status(500).json({ 
      message: 'Erro ao contar alertas não lidos',
      error: error.message 
    });
  }
};
