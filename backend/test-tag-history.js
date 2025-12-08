/**
 * Teste: Histórico de Tag
 * Valida o endpoint GET /api/tag-history/:tagKey
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';
const CREDENTIALS = { email: 'joao.silva@example.com', password: 'senha123' };

async function login() {
  const res = await axios.post(`${BASE_URL}/auth/login`, CREDENTIALS, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
  });
  return res.data.token;
}

async function getAnyPatientId(token) {
  const res = await axios.get(`${BASE_URL}/patients`, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 15000,
  });
  const list = res.data?.patients || res.data?.results || res.data || [];
  if (!Array.isArray(list) || list.length === 0) return null;
  const p = list[0];
  return p.id || p._id || p.patient_id || p.uuid || p.Id || null;
}

async function getTagHistory(token, patientId, tagKey = 'PESO') {
  const res = await axios.get(`${BASE_URL}/tag-history/${encodeURIComponent(tagKey)}`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { patientId },
    timeout: 20000,
  });
  return res.data;
}

async function run() {
  try {
    console.log('🚀 Testando histórico de tag...');
    const token = await login();
    console.log('🔑 Token obtido:', token.substring(0, 20) + '...');

    const patientId = await getAnyPatientId(token);
    if (!patientId) {
      console.log('⚠️ Nenhum paciente encontrado para testar.');
      return;
    }
    console.log('👤 Paciente ID:', patientId);

    const data = await getTagHistory(token, patientId, 'PESO');
    console.log('✅ Resposta /tag-history/PESO:');
    console.log(JSON.stringify({ count: data.count, sample: data.items?.slice(0, 3) }, null, 2));

    // Também testar ALTURA
    const altura = await getTagHistory(token, patientId, 'ALTURA');
    console.log('✅ Resposta /tag-history/ALTURA:');
    console.log(JSON.stringify({ count: altura.count, sample: altura.items?.slice(0, 3) }, null, 2));

  } catch (err) {
    console.error('❌ Falha no teste de histórico de tags');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
      console.error('URL:', err.config?.url);
      console.error('Method:', err.config?.method);
    } else {
      console.error('Erro:', err.message);
      try { console.error('Detalhes:', err.toJSON ? err.toJSON() : err); } catch (_) {}
    }
  }
}

run();