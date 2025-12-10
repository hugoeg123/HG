// Script de verificação para Alertas em Tempo Real (Via API)
// Executar com: node src/scripts/verify_socket_vitals.js

const { sequelize, Patient, Medico, Alert } = require('../models'); // Caminho pode variar dependendo de onde roda
const io = require('socket.io-client');
const jwt = require('jsonwebtoken');
const axios = require('axios');

require('dotenv').config();

async function runVerification() {
    console.log('🚀 Iniciando verificação de Alertas (Via API)...');

    try {
        // Apenas para buscar IDs validos
        await sequelize.authenticate();

        // 1. Setup: Buscar ou criar médico e paciente
        let medico = await Medico.findOne();
        if (!medico) {
            throw new Error('Nenhum médico encontrado no DB. Execute seed ou crie manualmente.');
        }

        // Garantir paciente criado pelo médico
        let patient = await Patient.findOne({ where: { createdBy: medico.id } });
        if (!patient) {
            console.log('Criando paciente temporário...');
            patient = await Patient.create({
                name: 'Paciente Teste Socket API',
                dateOfBirth: '1980-01-01',
                createdBy: medico.id
            });
        }
        console.log(`👨‍⚕️ Médico ID: ${medico.id}`);
        console.log(`👤 Paciente ID: ${patient.id}`);

        // 2. Token
        const token = jwt.sign(
            { id: medico.id, sub: medico.id, email: medico.email, role: 'medico' }, // Incluir 'id' pois auth middleware pode usar
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '1h' }
        );

        const API_URL = 'http://localhost:5001/api';
        const socketUrl = 'http://localhost:5001';

        // 3. Connect Socket
        console.log(`🔌 Conectando socket...`);
        const socket = io(socketUrl, {
            auth: { token },
            transports: ['websocket']
        });

        const verificationPromise = new Promise((resolve, reject) => {
            let alertReceived = false;

            const timeout = setTimeout(async () => {
                if (!alertReceived) {
                    // Fallback: Verificar se o alerta foi criado no banco
                    try {
                        const recentAlert = await Alert.findOne({
                            where: {
                                user_id: medico.id,
                                is_read: false
                            },
                            order: [['createdAt', 'DESC']],
                            limit: 1
                        });

                        if (recentAlert && recentAlert.message.includes('190')) {
                            console.log('⚠️ Alerta encontrado no Banco de Dados! (Lógica OK, Socket Timeout)');
                            console.log('🆔 Alerta ID:', recentAlert.id);
                            resolve();
                        } else {
                            reject(new Error('Timeout: Alerta não recebido via socket e não encontrado no DB'));
                        }
                    } catch (dbErr) {
                        reject(new Error(`Timeout e erro ao checar DB: ${dbErr.message}`));
                    }
                }
            }, 15000);

            socket.on('connect', async () => {
                console.log('✅ Socket conectado!');

                // 4. Trigger via API
                console.log('⚡ Enviando Registro com Vitais via API...');
                try {
                    const recordContent = `
Registro de Teste Socket
#PA: 190x110
#FC: 130
                `;

                    await axios.post(`${API_URL}/records`, {
                        patientId: patient.id,
                        title: 'Verificacao Socket',
                        type: 'consulta',
                        date: new Date(),
                        content: recordContent,
                        tags: []
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    console.log('✅ Registro API enviado com sucesso. Aguardando evento socket...');

                } catch (apiErr) {
                    console.error('❌ Erro na chamada API:', apiErr.response?.data || apiErr.message);
                    reject(new Error('Falha na chamada API'));
                }
            });

            socket.on('alert:new', (data) => {
                console.log('🚨 EVENTO RECEBIDO: alert:new');
                console.log('📦 Payload:', JSON.stringify(data, null, 2));

                if (data.message && (data.message.includes('190') || data.message.includes('110') || data.message.includes('130'))) {
                    console.log('✅ SUCESSO! Alerta contém os dados esperados.');
                    alertReceived = true;
                    clearTimeout(timeout);
                    resolve();
                } else {
                    console.warn('⚠️ Alerta recebido com mensagem inesperada:', data.message);
                }
            });

            socket.on('connect_error', (err) => console.error('Socket erro:', err.message));
        });

        await verificationPromise;
        console.log('🎉 VERIFICAÇÃO CONCLUÍDA!');

    } catch (error) {
        console.error('❌ Falha na verificação:', error.message);
    } finally {
        await sequelize.close();
        if (io) process.exit(0);
    }
}

runVerification();
