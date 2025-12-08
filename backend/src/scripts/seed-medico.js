/**
 * Script para inserir médico de teste
 * 
 * Este script cria o médico mencionado no problema de autenticação
 * Execute com: node src/scripts/seed-medico.js
 */

const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database-pg');
const { Medico } = require('../models/sequelize');

async function seedMedico() {
    try {
        console.log('Conectando ao banco de dados...');
        await sequelize.authenticate();
        console.log('Conexão estabelecida com sucesso.');

        // Verificar se o médico já existe
        const email = 'hgarib94@gmail.com';
        const existingMedico = await Medico.findOne({ where: { email } });
        if (existingMedico) {
            console.log('Médico de teste já existe:', existingMedico.email);
            // Atualizar senha para garantir
            const salt = await bcrypt.genSalt(10);
            const senha_hash = await bcrypt.hash('senha123', salt);
            await existingMedico.update({ senha_hash });
            console.log('Senha atualizada para "senha123"');
            return;
        }

        // Gerar hash para a senha
        const salt = await bcrypt.genSalt(10);
        const senha_hash = await bcrypt.hash('senha123', salt);

        // Criar médico de teste
        const testMedico = await Medico.create({
            id: '86b9e580-ebb2-4b9a-b82a-bfdad9441f06',
            nome: 'Hugo Garib',
            email: email,
            senha_hash: senha_hash,
            professional_type: 'medico',
            professional_id: '215852',
            specialty: 'Clínica Geral',
            titulo_profissional: 'Médico Generalista',
            biografia: 'Médico dedicado com experiência em clínica geral.',
            public_visibility: true
        });

        console.log('Médico de teste criado com sucesso:');
        console.log('- ID:', testMedico.id);
        console.log('- Nome:', testMedico.nome);
        console.log('- Email:', testMedico.email);

    } catch (error) {
        console.error('Erro ao criar médico de teste:', error);
    } finally {
        await sequelize.close();
        console.log('Conexão fechada.');
    }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
    seedMedico();
}

module.exports = seedMedico;
