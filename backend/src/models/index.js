/**
 * Índice de Modelos
 * 
 * Exporta todos os modelos do PostgreSQL/Sequelize para facilitar a importação
 */

const { sequelize } = require('../config/database-pg');
const User = require('./sequelize/User');
const Patient = require('./sequelize/Patient');
const Record = require('./sequelize/Record');
const Tag = require('./sequelize/Tag');
const Template = require('./sequelize/Template');
const Calculator = require('./sequelize/Calculator');
const Alert = require('./sequelize/Alert');
const Medico = require('./sequelize/Medico')(sequelize);
const AvailabilitySlot = require('./sequelize/AvailabilitySlot')(sequelize);
const Appointment = require('./sequelize/Appointment')(sequelize);

module.exports = {
  User,
  Patient,
  Record,
  Tag,
  Template,
  Calculator,
  Alert,
  Medico,
  AvailabilitySlot,
  Appointment
};