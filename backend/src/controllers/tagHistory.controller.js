/**
 * Controller: Tag History
 * 
 * Agrega histórico por tag a partir de múltiplas fontes:
 * - PatientTagEntry (entradas estruturadas do paciente)
 * - Record (registros médicos com tags JSONB e conteúdo livre)
 * - PatientAnthropometrics (dados estruturados de peso/altura)
 * - PatientVitalSigns (dados estruturados de sinais vitais)
 * 
 * Conectores:
 * - Models: Record, PatientTagEntry, Medico, PatientAnthropometrics, PatientVitalSigns
 * - Middleware: auth (usa req.user para role/nome)
 * - Rota: routes/tag-history.routes.js
 */

const { Op } = require('sequelize');
const { Record, PatientTagEntry, Medico, PatientAnthropometrics, PatientVitalSigns } = require('../models/sequelize');

function normalizeTagKey(key) {
  return String(key || '').trim().toUpperCase();
}

function getSynonyms(tagKey) {
    const key = normalizeTagKey(tagKey);
    if (['PESO', 'P', 'WEIGHT'].includes(key)) return ['PESO', 'P', 'WEIGHT'];
    if (['ALTURA', 'H', 'HEIGHT'].includes(key)) return ['ALTURA', 'H', 'HEIGHT'];
    return [key];
}

function getPrimaryKey(tagKey) {
    const key = normalizeTagKey(tagKey);
    if (['PESO', 'P', 'WEIGHT'].includes(key)) return 'PESO';
    if (['ALTURA', 'H', 'HEIGHT'].includes(key)) return 'ALTURA';
    return key;
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

function extractFromContent(content, synonyms) {
  const text = String(content || '');
  const results = [];
  
  for (const tagKey of synonyms) {
    const regex = new RegExp(`#${tagKey}\\s*:\\s*([^\n]+)`, 'gi');
    let m;
    while ((m = regex.exec(text))) {
      const raw = m[1]?.trim();
      const parsed = parseNumericWithUnit(raw);
      results.push(parsed);
    }
  }
  return results;
}

exports.getHistory = async (req, res) => {
  try {
    const originalTagKey = normalizeTagKey(req.params.tagKey);
    const synonyms = getSynonyms(originalTagKey);
    const primaryKey = getPrimaryKey(originalTagKey);
    const { patientId, start, end, limit } = req.query;

    if (!patientId) {
      return res.status(400).json({ error: 'Parâmetro patientId é obrigatório' });
    }

    const window = {};
    if (start) window[Op.gte] = new Date(start);
    if (end) window[Op.lte] = new Date(end);

    const timeline = [];

    // 1) PatientAnthropometrics (Only for PESO/ALTURA)
    if (primaryKey === 'PESO' || primaryKey === 'ALTURA') {
        const paWhere = { patient_id: patientId };
        if (start || end) paWhere.recorded_at = window;
        
        try {
            const anthroEntries = await PatientAnthropometrics.findAll({
                where: paWhere,
                order: [['recorded_at', 'ASC']]
            });
            
            for (const entry of anthroEntries) {
                let val = null;
                let unit = null;
                
                if (primaryKey === 'PESO' && entry.weight_kg) {
                    val = entry.weight_kg;
                    unit = 'kg';
                } else if (primaryKey === 'ALTURA' && entry.height_m) {
                    val = parseFloat((entry.height_m * 100).toFixed(1)); // Convert m to cm
                    unit = 'cm';
                }
                
                if (val !== null) {
                    timeline.push({
                        source: 'anthropometrics',
                        tagKey: primaryKey,
                        value: val,
                        unit: unit,
                        raw: `${val}${unit}`,
                        timestamp: entry.recorded_at,
                        actorRole: entry.recorded_by ? 'professional' : 'patient', 
                        actorName: 'Registro Antropométrico'
                    });
                }
            }
        } catch (err) {
            console.warn('Erro ao buscar PatientAnthropometrics:', err.message);
        }
    }

    // 1.5) PatientVitalSigns (For PAS, PAD, FC, FR, SPO2, TEMP)
    const vitalsMap = {
        'PAS': 'systolic_bp',
        'PAD': 'diastolic_bp',
        'FC': 'heart_rate',
        'FR': 'respiratory_rate',
        'SPO2': 'spo2',
        'SAT': 'spo2',
        'TEMP': 'temperature',
        'TEMPERATURA': 'temperature'
    };
    
    const vitalField = vitalsMap[primaryKey];
    
    if (vitalField) {
         const vsWhere = { patient_id: patientId };
         if (start || end) vsWhere.recorded_at = window;
         
         try {
             const vsEntries = await PatientVitalSigns.findAll({
                 where: vsWhere,
                 order: [['recorded_at', 'ASC']]
             });
             
             for (const entry of vsEntries) {
                 const val = entry[vitalField];
                 if (val != null) {
                      timeline.push({
                         source: 'vital_signs',
                         tagKey: primaryKey,
                         value: parseFloat(val),
                         unit: null, 
                         raw: String(val),
                         timestamp: entry.recorded_at,
                         actorRole: 'professional', 
                         actorName: 'Sinais Vitais'
                     });
                 }
             }
         } catch(err) {
             console.warn('Erro ao buscar PatientVitalSigns:', err.message);
         }
    }

    // 2) Entradas estruturadas do paciente (PatientTagEntry)
    const ptWhere = { patient_id: patientId };
    if (start || end) ptWhere.createdAt = window;
    const patientEntries = await PatientTagEntry.findAll({
      where: ptWhere,
      order: [['createdAt', 'ASC']]
    });

    for (const entry of patientEntries) {
      const tags = entry.tags || {};
      
      // Check all synonyms
      let valueCandidate = undefined;
      for (const key of synonyms) {
          if (tags[key] !== undefined) valueCandidate = tags[key];
          if (tags[`#${key}`] !== undefined) valueCandidate = tags[`#${key}`];
          if (valueCandidate !== undefined) break;
      }

      if (valueCandidate !== undefined) {
        const parsed = parseNumericWithUnit(valueCandidate);
        timeline.push({
          source: 'patient_input',
          tagKey: primaryKey,
          value: parsed.value,
          unit: parsed.unit,
          raw: parsed.raw,
          timestamp: entry.createdAt,
          actorRole: entry.source === 'patient' ? 'patient' : entry.source,
          actorName: req.user?.role === 'patient' ? (req.user?.name || 'Paciente') : 'Paciente',
        });
      }
    }

    // 3) Registros médicos (tags JSONB + conteúdo livre)
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

    for (const rec of records) {
      const recTags = rec.tags;
      let pushed = false;

      // a) tags estruturadas no JSONB
      if (recTags && typeof recTags === 'object') {
        let valueCandidate = undefined;
        for (const key of synonyms) {
            if (recTags[key] !== undefined) valueCandidate = recTags[key];
            if (recTags[`#${key}`] !== undefined) valueCandidate = recTags[`#${key}`];
            if (valueCandidate !== undefined) break;
        }

        if (valueCandidate !== undefined) {
          const parsed = parseNumericWithUnit(valueCandidate);
          timeline.push({
            source: 'record_tag',
            tagKey: primaryKey,
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
        const extracted = extractFromContent(rec.content, synonyms);
        for (const item of extracted) {
          timeline.push({
            source: 'record_content',
            tagKey: primaryKey,
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
    timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Newest first

    if (limit) {
        const limited = timeline.slice(0, Number(limit));
        // Reverse back to chronological for consistency if needed, but usually single item doesn't matter.
        // If it's a list for a chart, we want chronological (oldest -> newest).
        limited.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        return res.json({
            tagKey: primaryKey,
            patientId,
            count: limited.length,
            items: limited
        });
    }
    
    // Default: return all, chronological
    timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return res.json({
      tagKey: primaryKey,
      patientId,
      count: timeline.length,
      items: timeline
    });
  } catch (error) {
    console.error('Erro ao obter histórico de tag:', error);
    return res.status(500).json({ error: 'Erro interno ao obter histórico de tag' });
  }
};
