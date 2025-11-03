/**
 * Modelo de Paciente (Sequelize/PostgreSQL)
 * 
 * Define a estrutura de dados para pacientes no PostgreSQL usando Sequelize
 * 
 * Conector: Integra com o sistema de banco de dados PostgreSQL e é usado pelos controladores
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database-pg');

/**
 * Modelo Sequelize para Paciente
 * @class Patient
 * @extends Model
 */
class Patient extends Model {}

Patient.init({
  // ID do paciente (chave primária)
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // Nome do paciente
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Data de nascimento
  dateOfBirth: {
    type: DataTypes.DATE,
    allowNull: false
  },
  // Gênero
  gender: {
    type: DataTypes.ENUM('masculino', 'feminino', 'outro', 'não informado'),
    defaultValue: 'não informado'
  },
  // CPF
  cpf: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  // Informações de contato - Email
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  // Informações de contato - Telefone
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Autenticação: hash de senha do paciente (bcrypt)
  password_hash: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Demografia adicional
  race_color: {
    type: DataTypes.ENUM('branca', 'preta', 'parda', 'amarela', 'indigena', 'outra'),
    allowNull: true
  },
  nationality: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Informações de contato - Contato de emergência (nome)
  emergencyContactName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Informações de contato - Contato de emergência (telefone)
  emergencyContactPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Informações de contato - Contato de emergência (relacionamento)
  emergencyContactRelationship: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Endereço - Rua
  street: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Endereço - Cidade
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Endereço - Estado
  state: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Endereço - CEP
  zipCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Endereço - País
  country: {
    type: DataTypes.STRING,
    defaultValue: 'Brasil',
    allowNull: true
  },
  // Informações médicas - Tipo sanguíneo
  bloodType: {
    type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Desconhecido'),
    defaultValue: 'Desconhecido'
  },
  // Informações médicas - Alergias (array JSON)
  allergies: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  // Informações médicas - Condições crônicas (array JSON)
  chronicConditions: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  // Informações médicas - Medicamentos (array JSON)
  medications: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  // Informações médicas - Histórico familiar (array JSON)
  familyHistory: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  // ID do usuário que criou o paciente
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'medicos',
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'Patient',
  tableName: 'patients',
  timestamps: true
});

// Hook para buscar pacientes por nome (pesquisa de texto)
Patient.findByName = async function(name) {
  return await this.findAll({
    where: {
      name: {
        [sequelize.Op.iLike]: `%${name}%`
      }
    }
  });
};

module.exports = Patient;