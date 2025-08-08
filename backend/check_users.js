const { User } = require('./src/models');

async function checkUsers() {
  try {
    const users = await User.findAll({ 
      attributes: ['id', 'email', 'name'] 
    });
    
    console.log('Usuários encontrados:');
    users.forEach(user => {
      console.log(`ID: ${user.id}, Email: ${user.email}, Nome: ${user.name}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Erro:', err);
    process.exit(1);
  }
}

checkUsers();