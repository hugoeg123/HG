/**
 * Script para inserir usuário de teste específico
 * 
 * Este script cria o usuário mencionado no problema de autenticação
 * Execute com: node src/scripts/seed-test-user.js
 */

const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database-pg');
const { User } = require('../models');

async function seedTestUser() {
  try {
    console.log('Conectando ao banco de dados...');
    await sequelize.authenticate();
    console.log('Conexão estabelecida com sucesso.');

    // Verificar se o usuário já existe
    const existingUser = await User.findByPk('86b9e580-ebb2-4b9a-b82a-bfdad9441f06');
    if (existingUser) {
      console.log('Usuário de teste já existe:', existingUser.email);
      return;
    }

    // Gerar hash para a senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('senha123', salt);

    // Criar usuário de teste
    const testUser = await User.create({
      id: '86b9e580-ebb2-4b9a-b82a-bfdad9441f06',
      name: 'hugo',
      email: 'hgarib94@gmail.com',
      password: hashedPassword,
      professionalType: 'medico',
      professionalId: '215852',
      specialty: 'Clínica Geral',
      isAdmin: false,
      isActive: true
    });

    console.log('Usuário de teste criado com sucesso:');
    console.log('- ID:', testUser.id);
    console.log('- Nome:', testUser.name);
    console.log('- Email:', testUser.email);
    console.log('- Tipo Profissional:', testUser.professionalType);
    console.log('- ID Profissional:', testUser.professionalId);
    
  } catch (error) {
    console.error('Erro ao criar usuário de teste:', error);
  } finally {
    await sequelize.close();
    console.log('Conexão fechada.');
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  seedTestUser();
}

module.exports = seedTestUser;