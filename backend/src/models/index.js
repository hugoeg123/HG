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

module.exports = {
  User,
  Patient,
  Record,
  Tag,
  Template
};