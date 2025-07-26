/**
 * Exportação de controladores
 * 
 * Este arquivo exporta todos os controladores para facilitar a importação
 */

const authController = require('./auth.controller');
const patientController = require('./patient.controller');
const recordController = require('./record.controller');
const tagController = require('./tag.controller');
const templateController = require('./template.controller');

module.exports = {
  authController,
  patientController,
  recordController,
  tagController,
  templateController
};