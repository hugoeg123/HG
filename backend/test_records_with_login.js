const axios = require('axios');

async function testRecordsWithLogin() {
    try {
        console.log('1. Fazendo login...');
        
        // Primeiro, fazer login para obter o token
        const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
            email: 'joao.silva@example.com',
            password: 'senha123'
        });
        
        const token = loginResponse.data.token;
        console.log('Login bem-sucedido! Token obtido.');
        
        console.log('\n2. Testando busca de registros...');
        
        // Agora testar a busca de registros com o token
        const recordsResponse = await axios.get(
            'http://localhost:5001/api/records/patient/0a3565f7-14e6-44e7-9385-5974e117065d',
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('Status:', recordsResponse.status);
        console.log('Resposta completa:', JSON.stringify(recordsResponse.data, null, 2));
        
        if (Array.isArray(recordsResponse.data)) {
            console.log('Registros encontrados:', recordsResponse.data.length);
            if (recordsResponse.data.length > 0) {
                console.log('Primeiro registro:', {
                    id: recordsResponse.data[0].id,
                    content: recordsResponse.data[0].content?.substring(0, 100) + '...',
                    created_at: recordsResponse.data[0].created_at
                });
            }
        } else {
            console.log('Tipo de resposta:', typeof recordsResponse.data);
        }
        
    } catch (error) {
        console.error('Erro:', error.response?.status, error.response?.data || error.message);
    }
}

testRecordsWithLogin();