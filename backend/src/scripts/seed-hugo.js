/**
 * Script para inserir médico de teste específico (solicitado pelo usuário)
 * 
 * Cria/Atualiza o usuário hugo@gmail.com com senha extra-300
 * Execute com: node src/scripts/seed-hugo.js
 */

const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database-pg');
const { Medico } = require('../models/sequelize');

async function seedHugo() {
    try {
        console.log('Conectando ao banco de dados...');
        await sequelize.authenticate();
        console.log('Conexão estabelecida com sucesso.');

        const email = 'hugo@gmail.com';
        const password = 'extra-300';

        // Gerar hash para a senha
        const salt = await bcrypt.genSalt(10);
        const senha_hash = await bcrypt.hash(password, salt);

        // Verificar se o médico já existe
        const existingMedico = await Medico.findOne({ where: { email } });

        if (existingMedico) {
            console.log('Usuário hugo@gmail.com já existe. Atualizando senha...');
            await existingMedico.update({
                senha_hash: senha_hash,
                // Garantir que campos obrigatórios estejam preenchidos
                nome: existingMedico.nome || 'Hugo Profissional',
                professional_type: existingMedico.professional_type || 'medico',
                public_visibility: true
            });
            console.log('Usuário atualizado com sucesso.');
        } else {
            console.log('Criando novo usuário hugo@gmail.com...');
            const newMedico = await Medico.create({
                id: '99b9e580-ebb2-4b9a-b82a-bfdad9441f99', // ID fixo para facilitar
                nome: 'Hugo Profissional',
                email: email,
                senha_hash: senha_hash,
                professional_type: 'medico',
                professional_id: '123456',
                specialty: 'Cardiologia',
                titulo_profissional: 'Cardiologista',
                biografia: 'Médico especialista em cardiologia.',
                public_visibility: true
            });
            console.log('Usuário criado com sucesso:', newMedico.id);
        }

    } catch (error) {
        console.error('Erro ao criar/atualizar usuário hugo:', error);
    } finally {
        await sequelize.close();
        console.log('Conexão fechada.');
    }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
    seedHugo();
}

module.exports = seedHugo;
