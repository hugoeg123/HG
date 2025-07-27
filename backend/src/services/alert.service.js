/**
 * Serviço de Alertas
 * 
 * Contém a lógica de negócio para operações CRUD de alertas
 * e funcionalidades específicas como marcar como lido
 * 
 * Conectores:
 * - models/sequelize/Alert.js para operações de banco
 * - models/sequelize/User.js e Record.js para relacionamentos
 * - controllers/alert.controller.js como consumidor
 */

const { Alert, User, Record, Patient } = require('../models');
const { Op } = require('sequelize');

/**
 * Serviço de Alertas
 * @class AlertService
 */
class AlertService {
  /**
   * Cria um novo alerta
   * @param {Object} alertData - Dados do alerta
   * @param {string} alertData.user_id - ID do usuário
   * @param {string} alertData.record_id - ID do registro
   * @param {string} alertData.message - Mensagem do alerta
   * @param {string} alertData.severity - Severidade (info, warning, critical)
   * @returns {Promise<Object>} Alerta criado
   */
  async createAlert(alertData) {
    try {
      const alert = await Alert.create(alertData);
      return alert;
    } catch (error) {
      throw new Error(`Erro ao criar alerta: ${error.message}`);
    }
  }

  /**
   * Lista alertas do usuário com filtros opcionais
   * @param {string} userId - ID do usuário
   * @param {Object} filters - Filtros de busca
   * @param {string} filters.severity - Filtrar por severidade
   * @param {boolean} filters.unread - Mostrar apenas não lidos
   * @param {number} filters.limit - Limite de resultados
   * @param {number} filters.offset - Offset para paginação
   * @returns {Promise<Array>} Lista de alertas
   */
  async getAlerts(userId, filters = {}) {
    try {
      const whereClause = {
        user_id: userId
      };

      // Aplicar filtros
      if (filters.severity) {
        whereClause.severity = filters.severity;
      }

      if (filters.unread === true) {
        whereClause.is_read = false;
      }

      const alerts = await Alert.findAll({
        where: whereClause,
        include: [
          {
            model: Record,
            as: 'record',
            attributes: ['id', 'title', 'type'],
            include: [
              {
                model: Patient,
                as: 'patient',
                attributes: ['id', 'name']
              }
            ]
          }
        ],
        order: [['created_at', 'DESC']],
        limit: filters.limit || 50,
        offset: filters.offset || 0
      });

      return alerts;
    } catch (error) {
      throw new Error(`Erro ao buscar alertas: ${error.message}`);
    }
  }

  /**
   * Obtém um alerta específico
   * @param {string} alertId - ID do alerta
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object>} Alerta encontrado
   */
  async getAlertById(alertId, userId) {
    try {
      const alert = await Alert.findOne({
        where: {
          id: alertId,
          user_id: userId
        },
        include: [
          {
            model: Record,
            as: 'record',
            attributes: ['id', 'title', 'type', 'content'],
            include: [
              {
                model: Patient,
                as: 'patient',
                attributes: ['id', 'name']
              }
            ]
          }
        ]
      });
      
      if (!alert) {
        throw new Error('Alerta não encontrado');
      }

      return alert;
    } catch (error) {
      throw new Error(`Erro ao buscar alerta: ${error.message}`);
    }
  }

  /**
   * Marca um alerta como lido
   * @param {string} alertId - ID do alerta
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object>} Alerta atualizado
   */
  async markAsRead(alertId, userId) {
    try {
      const alert = await Alert.findOne({
        where: {
          id: alertId,
          user_id: userId
        }
      });
      
      if (!alert) {
        throw new Error('Alerta não encontrado');
      }

      await alert.update({
        is_read: true,
        read_at: new Date()
      });

      return alert;
    } catch (error) {
      throw new Error(`Erro ao marcar alerta como lido: ${error.message}`);
    }
  }

  /**
   * Marca todos os alertas do usuário como lidos
   * @param {string} userId - ID do usuário
   * @returns {Promise<number>} Número de alertas atualizados
   */
  async markAllAsRead(userId) {
    try {
      const [updatedCount] = await Alert.update(
        {
          is_read: true,
          read_at: new Date()
        },
        {
          where: {
            user_id: userId,
            is_read: false
          }
        }
      );

      return updatedCount;
    } catch (error) {
      throw new Error(`Erro ao marcar todos os alertas como lidos: ${error.message}`);
    }
  }

  /**
   * Deleta um alerta
   * @param {string} alertId - ID do alerta
   * @param {string} userId - ID do usuário
   * @returns {Promise<boolean>} Sucesso da operação
   */
  async deleteAlert(alertId, userId) {
    try {
      const alert = await Alert.findOne({
        where: {
          id: alertId,
          user_id: userId
        }
      });
      
      if (!alert) {
        throw new Error('Alerta não encontrado');
      }

      await alert.destroy();
      return true;
    } catch (error) {
      throw new Error(`Erro ao deletar alerta: ${error.message}`);
    }
  }

  /**
   * Conta alertas não lidos do usuário
   * @param {string} userId - ID do usuário
   * @returns {Promise<number>} Número de alertas não lidos
   */
  async getUnreadCount(userId) {
    try {
      const count = await Alert.count({
        where: {
          user_id: userId,
          is_read: false
        }
      });

      return count;
    } catch (error) {
      throw new Error(`Erro ao contar alertas não lidos: ${error.message}`);
    }
  }

  /**
   * Gera alertas automáticos baseados em regras de negócio
   * @param {string} recordId - ID do registro
   * @param {string} userId - ID do usuário
   * @returns {Promise<Array>} Alertas criados
   */
  async generateAutomaticAlerts(recordId, userId) {
    try {
      const alerts = [];
      
      // Aqui podem ser implementadas regras de negócio para gerar alertas automáticos
      // Por exemplo: valores críticos, medicações vencidas, etc.
      
      // Exemplo de regra simples:
      const record = await Record.findByPk(recordId);
      if (record && record.content) {
        // Verificar se há palavras-chave que indicam situações críticas
        const criticalKeywords = ['emergência', 'crítico', 'urgente', 'grave'];
        const hasKeyword = criticalKeywords.some(keyword => 
          record.content.toLowerCase().includes(keyword)
        );
        
        if (hasKeyword) {
          const alert = await this.createAlert({
            user_id: userId,
            record_id: recordId,
            message: 'Registro contém indicadores de situação crítica',
            severity: 'critical'
          });
          alerts.push(alert);
        }
      }
      
      return alerts;
    } catch (error) {
      throw new Error(`Erro ao gerar alertas automáticos: ${error.message}`);
    }
  }
}

module.exports = new AlertService();