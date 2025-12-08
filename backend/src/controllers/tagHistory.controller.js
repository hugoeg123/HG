/**
 * Controller: Tag History
 * 
 * Agrega histórico por tag a partir de múltiplas fontes:
 * - PatientTagEntry (entradas estruturadas do paciente)
 * - Record (registros médicos com tags JSONB e conteúdo livre)
 * 
 * Conectores:
 * - Models: Record, PatientTagEntry, Medico (autor)
 * - Middleware: auth (usa req.user para role/nome)
 * - Rota: routes/tag-history.routes.js
 */

const { Op } = require('sequelize');
const { Record, PatientTagEntry, Medico } = require('../models/sequelize');

function normalizeTagKey(key) {
  return String(key || '').trim().toUpperCase();
}

function parseNumericWithUnit(raw) {
  if (!raw) return { value: null, unit: null, raw: null };
  const cleaned = String(raw).trim();
  const numMatch = cleaned.match(/-?\d+(?:[\.,]\d+)?/);
  if (!numMatch) return { value: cleaned, unit: null, raw: cleaned };
  const numStr = numMatch[0].replace(',', '.');
  const value = parseFloat(numStr);
  const unit = cleaned.replace(numMatch[0], '').trim() || null;
  return { value, unit, raw: cleaned };
}

function extractFromContent(content, tagKey) {
  const text = String(content || '');
  const regex = new RegExp(`#${tagKey}\\s*:\\s*([^\n]+)`, 'gi');
  const results = [];
  let m;
  while ((m = regex.exec(text))) {
    const raw = m[1]?.trim();
    const parsed = parseNumericWithUnit(raw);
    results.push(parsed);
  }
  return results;
}

exports.getHistory = async (req, res) => {
  try {
    const tagKey = normalizeTagKey(req.params.tagKey);
    const { patientId, start, end, limit } = req.query;

    if (!patientId) {
      return res.status(400).json({ error: 'Parâmetro patientId é obrigatório' });
    }

    const window = {};
    if (start) window[Op.gte] = new Date(start);
    if (end) window[Op.lte] = new Date(end);

    // 1) Entradas estruturadas do paciente
    const ptWhere = { patient_id: patientId };
    if (start || end) ptWhere.createdAt = window;
    const patientEntries = await PatientTagEntry.findAll({
      where: ptWhere,
      order: [['createdAt', 'ASC']]
    });

    // 2) Registros médicos (tags JSONB + conteúdo livre)
    const recWhere = { patientId };
    if (start || end) recWhere.date = window;
    const records = await Record.findAll({
      where: recWhere,
      attributes: ['id', 'patientId', 'date', 'tags', 'content', 'createdBy'],
      include: [
        { model: Medico, as: 'medicoCriador', attributes: ['nome', 'professional_id', 'specialty'] }
      ],
      order: [['date', 'ASC']]
    });

    const timeline = [];

    // Mapear entradas do paciente
    for (const entry of patientEntries) {
      const tags = entry.tags || {};
      const valueCandidate = tags[tagKey] ?? tags[`#${tagKey}`];
      if (valueCandidate !== undefined) {
        const parsed = parseNumericWithUnit(valueCandidate);
        timeline.push({
          source: 'patient_input',
          tagKey,
          value: parsed.value,
          unit: parsed.unit,
          raw: parsed.raw,
          timestamp: entry.createdAt,
          actorRole: entry.source === 'patient' ? 'patient' : entry.source,
          actorName: req.user?.role === 'patient' ? (req.user?.name || 'Paciente') : 'Paciente',
        });
      }
    }

    // Mapear registros médicos
    for (const rec of records) {
      const recTags = rec.tags;
      let pushed = false;

      // a) tags estruturadas no JSONB
      if (recTags && typeof recTags === 'object') {
        const fromJson = recTags[tagKey] ?? recTags[`#${tagKey}`];
        if (fromJson !== undefined) {
          const parsed = parseNumericWithUnit(fromJson);
          timeline.push({
            source: 'record_tag',
            tagKey,
            value: parsed.value,
            unit: parsed.unit,
            raw: parsed.raw,
            timestamp: rec.date || rec.createdAt,
            actorRole: 'doctor',
            actorName: rec.medicoCriador?.nome || 'Médico',
          });
          pushed = true;
        }
      }

      // b) conteúdo livre com regex
      if (!pushed && rec.content) {
        const extracted = extractFromContent(rec.content, tagKey);
        for (const item of extracted) {
          timeline.push({
            source: 'record_content',
            tagKey,
            value: item.value,
            unit: item.unit,
            raw: item.raw,
            timestamp: rec.date || rec.createdAt,
            actorRole: 'doctor',
            actorName: rec.medicoCriador?.nome || 'Médico',
          });
        }
      }
    }

    // Ordenar e limitar
    timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const limited = limit ? timeline.slice(0, Number(limit)) : timeline;

    return res.json({
      tagKey,
      patientId,
      count: limited.length,
      items: limited
    });
  } catch (error) {
    console.error('Erro ao obter histórico de tag:', error);
    return res.status(500).json({ error: 'Erro interno ao obter histórico de tag' });
  }
};