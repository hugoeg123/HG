/**
 * Índice de Modelos Sequelize
 * 
 * MISSÃO ZERO-DÉBITO: Centraliza todos os modelos do sistema de tags dinâmicas
 * incluindo modelos legados e novos modelos para prontuário estruturado
 * 
 * Conector: Integra todos os modelos Sequelize e é usado pelos controladores
 */

const { sequelize } = require('../../config/database-pg');

// Modelos legados (manter compatibilidade)
const User = require('./User');
const Patient = require('./Patient');
const Record = require('./Record');
const Tag = require('./Tag');
const Template = require('./Template');
const Alert = require('./Alert');
const Calculator = require('./Calculator');
const CalculatorTag = require('./CalculatorTag');
const PatientAnthropometrics = require('./PatientAnthropometrics');
const PatientLifestyle = require('./PatientLifestyle');
const PatientCondition = require('./PatientCondition');

// Novos modelos do sistema de tags dinâmicas
const Medico = require('./Medico')(sequelize);
const Paciente = require('./Paciente')(sequelize);
const TagDinamica = require('./TagDinamica')(sequelize);
const Registro = require('./Registro')(sequelize);
const SecaoRegistro = require('./SecaoRegistro')(sequelize);
const AvailabilitySlot = require('./AvailabilitySlot')(sequelize);
const Appointment = require('./Appointment')(sequelize);
const PatientTagEntry = require('./PatientTagEntry')(sequelize);
const Review = require('./Review')(sequelize);

// Definir associações entre modelos legados

// Associações de User
User.hasMany(Patient, { foreignKey: 'createdBy', as: 'patients' });
User.hasMany(Record, { foreignKey: 'createdBy', as: 'createdRecords' });
User.hasMany(Record, { foreignKey: 'updatedBy', as: 'updatedRecords' });
User.hasMany(Tag, { foreignKey: 'createdBy', as: 'tags' });

// Associações de Patient
Patient.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Patient.hasMany(Record, { foreignKey: 'patientId', as: 'records' });
Patient.hasMany(PatientAnthropometrics, { foreignKey: 'patient_id', as: 'anthropometrics' });
Patient.hasMany(PatientLifestyle, { foreignKey: 'patient_id', as: 'lifestyles' });
Patient.hasMany(PatientCondition, { foreignKey: 'patient_id', as: 'conditions' });

PatientAnthropometrics.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });
PatientLifestyle.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });
PatientCondition.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

// Associações de Record
Record.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
// ✅ Novo: criador/atualizador apontando para MEDICO
Record.belongsTo(Medico, { foreignKey: 'createdBy', as: 'medicoCriador' });
Record.belongsTo(Medico, { foreignKey: 'updatedBy', as: 'medicoAtualizador' });

// Associações de Tag
Tag.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Associações de Template
Template.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Associações de Alert
Alert.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Alert.belongsTo(Record, { foreignKey: 'record_id', as: 'record' });
User.hasMany(Alert, { foreignKey: 'user_id', as: 'alerts' });
Record.hasMany(Alert, { foreignKey: 'record_id', as: 'alerts' });

// Associações de Calculator
Calculator.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });
User.hasMany(Calculator, { foreignKey: 'owner_id', as: 'calculators' });

// Associações many-to-many Calculator-Tag
Calculator.belongsToMany(Tag, {
  through: CalculatorTag,
  foreignKey: 'calculator_id',
  otherKey: 'tag_id',
  as: 'tags'
});
Tag.belongsToMany(Calculator, {
  through: CalculatorTag,
  foreignKey: 'tag_id',
  otherKey: 'calculator_id',
  as: 'calculators'
});

// Definir associações entre novos modelos
const models = {
  Medico,
  Paciente,
  TagDinamica,
  Registro,
  SecaoRegistro,
  AvailabilitySlot,
  Appointment,
  Patient,
  PatientTagEntry,
  Review
};

// Executar associações dos novos modelos
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Exportar todos os modelos e instância do Sequelize
module.exports = {
  sequelize,
  // Modelos legados
  User,
  Patient,
  Record,
  Tag,
  Template,
  Alert,
  Calculator,
  CalculatorTag,
  PatientAnthropometrics,
  PatientLifestyle,
  PatientCondition,
  // Novos modelos do sistema de tags dinâmicas
  Medico,
  Paciente,
  TagDinamica,
  Registro,
  SecaoRegistro,
  AvailabilitySlot,
  Appointment,
  PatientTagEntry,
  Review
};