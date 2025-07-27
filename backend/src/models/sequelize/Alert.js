/**
 * Modelo de Alerta (Sequelize/PostgreSQL)
 * 
 * Define a estrutura de dados para alertas no PostgreSQL usando Sequelize
 * 
 * Conector: Integra com o sistema de banco de dados PostgreSQL e é usado pelos controladores
 * Relacionamentos: Pertence a User e Record via foreign keys
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database-pg');

/**
 * Modelo Sequelize para Alert
 * @class Alert
 * @extends Model
 */
class Alert extends Model {
  /**
   * Verifica se o alerta pertence ao usuário especificado
   * @param {string} userId - ID do usuário
   * @returns {boolean} True se o alerta pertence ao usuário
   */
  belongsToUser(userId) {
    return this.user_id === userId;
  }

  /**
   * Retorna a cor baseada na severidade
   * @returns {string} Cor do alerta
   */
  getSeverityColor() {
    const colors = {
      info: '#3b82f6',
      warning: '#f59e0b',
      critical: '#ef4444'
    };
    return colors[this.severity] || colors.info;
  }
}

Alert.init({
  // ID do alerta (chave primária)
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // ID do usuário (foreign key)
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  // ID do registro médico (foreign key)
  record_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'records',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  // Mensagem do alerta
  message: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  // Severidade do alerta
  severity: {
    type: DataTypes.ENUM('info', 'warning', 'critical'),
    allowNull: false,
    defaultValue: 'info'
  },
  // Indica se o alerta foi lido
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  // Data de leitura do alerta
  read_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Alert',
  tableName: 'alerts',
  timestamps: true,
  underscored: true
});

// Hook para buscar alertas por severidade
Alert.findBySeverity = async function(severity, userId) {
  return await this.findAll({
    where: {
      severity,
      user_id: userId
    },
    order: [['created_at', 'DESC']]
  });
};

// Hook para buscar alertas não lidos
Alert.findUnread = async function(userId) {
  return await this.findAll({
    where: {
      user_id: userId,
      is_read: false
    },
    order: [['created_at', 'DESC']]
  });
};

module.exports = Alert;