/**
 * Índice de Modelos
 * 
 * Exporta todos os modelos do PostgreSQL/Sequelize para facilitar a importação
 */

const User = require('./sequelize/User');
const Patient = require('./sequelize/Patient');
const Record = require('./sequelize/Record');
const Tag = require('./sequelize/Tag');
const Template = require('./sequelize/Template');
const Calculator = require('./sequelize/Calculator');
const Alert = require('./sequelize/Alert');

module.exports = {
  User,
  Patient,
  Record,
  Tag,
  Template,
  Calculator,
  Alert
};