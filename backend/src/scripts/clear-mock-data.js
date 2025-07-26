const { sequelize } = require('../config/database-pg');
const { Patient, Record } = require('../models');

async function clearMockData() {
  try {
    console.log('Conectando ao banco de dados...');
    await sequelize.authenticate();
    console.log('Conexão estabelecida com sucesso.');

    console.log('Removendo registros mock...');
    await Record.destroy({ where: {} });
    console.log('Registros removidos.');

    console.log('Removendo pacientes mock...');
    await Patient.destroy({ where: {} });
    console.log('Pacientes removidos.');

    console.log('Dados mock removidos com sucesso!');
  } catch (error) {
    console.error('Erro ao remover dados mock:', error);
  } finally {
    await sequelize.close();
    console.log('Conexão fechada.');
  }
}

clearMockData();