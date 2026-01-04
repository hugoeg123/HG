
const axios = require('axios');

async function testOllama() {
    const baseUrl = 'http://localhost:11434';
    try {
        console.log(`Testing connection to ${baseUrl}...`);
        const response = await axios.get(`${baseUrl}/api/tags`);
        console.log('Success!');
        console.log('Models found:', response.data.models.map(m => m.name));
    } catch (error) {
        console.error('Error connecting to Ollama:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
        }
    }
}

testOllama();
