/**
 * Modelo de Usuário (Sequelize/PostgreSQL)
 * 
 * Define a estrutura de dados para usuários no PostgreSQL usando Sequelize
 * 
 * Conector: Integra com o sistema de banco de dados PostgreSQL e é usado pelos controladores
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database-pg');
const bcrypt = require('bcryptjs');

/**
 * Modelo Sequelize para Usuário
 * @class User
 * @extends Model
 */
class User extends Model {
  /**
   * Verifica se a senha fornecida corresponde à senha do usuário
   * @param {string} password - Senha a ser verificada
   * @returns {boolean} Verdadeiro se a senha corresponder
   */
  async isValidPassword(password) {
    return await bcrypt.compare(password, this.password);
  }
}

User.init({
  // ID do usuário (chave primária)
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // Nome completo do profissional
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Email do profissional (único)
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  // Senha do profissional (hash)
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Tipo de profissional (médico, enfermeiro, etc.)
  professionalType: {
    type: DataTypes.ENUM('medico', 'enfermeiro', 'fisioterapeuta', 'psicologo', 'nutricionista', 'farmaceutico', 'outro'),
    allowNull: false,
    defaultValue: 'medico'
  },
  // CRM, COREN, ou outro registro profissional
  professionalId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'CRM, COREN, CRF, etc.'
  },
  // Especialidade médica ou área de atuação
  specialty: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Indica se o usuário é administrador
  isAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Status ativo/inativo
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
  hooks: {
    // Hook para hash da senha antes de salvar
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    // Hook para hash da senha antes de atualizar
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

module.exports = User;