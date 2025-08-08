const { Medico } = require('./src/models/sequelize');

async function checkMedicos() {
  try {
    const medicos = await Medico.findAll({ 
      attributes: ['id', 'email', 'nome'] 
    });
    
    console.log('Médicos encontrados:');
    medicos.forEach(medico => {
      console.log(`ID: ${medico.id}, Email: ${medico.email}, Nome: ${medico.nome}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Erro:', err);
    process.exit(1);
  }
}

checkMedicos();