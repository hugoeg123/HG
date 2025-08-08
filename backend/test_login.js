const axios = require('axios');

async function testLogin() {
    try {
        console.log('Testando login...');
        
        const response = await axios.post('http://localhost:5001/api/auth/login', {
            email: 'joao.silva@example.com',
            password: 'senha123'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Status:', response.status);
        console.log('Response:', response.data);
        
        if (response.data.token) {
            console.log('Token:', response.data.token.substring(0, 50) + '...');
        }
        
    } catch (error) {
        console.error('Erro:', error.response?.status, error.response?.data || error.message);
    }
}

testLogin();