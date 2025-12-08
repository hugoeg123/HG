/**
 * Controlador de Entradas de Saúde do Paciente (PatientTagEntry)
 *
 * Permite que pacientes registrem inputs de saúde com tags estruturadas.
 *
 * Connectors:
 * - Usa models/sequelize/PatientTagEntry.js (belongsTo Patient)
 * - Exposto via routes/patient-input.routes.js
 * - Integra com frontend Profile.jsx via patientInputService
 */

const { Op } = require('sequelize');
const { PatientTagEntry, Patient } = require('../models/sequelize');

// Garantir que a tabela exista sem depender de migração (fallback controlado)
let synced = false;
async function ensureSynced() {
  if (!synced) {
    try {
      await PatientTagEntry.sync();
      synced = true;
    } catch (e) {
      // Logar, mas não travar fluxo; ambiente pode usar migrações
      console.warn('PatientTagEntry.sync falhou (provável ambiente com migrações):', e?.message);
    }
  }
}

// Util: normaliza tags enviadas
function buildTags({ weight, height, smoking_status, cigarettes_per_day, years_smoked, years_since_quit, drinks_per_week, binge_last_30_days, mod_minutes_per_week, vig_minutes_per_week, strength_days_per_week }) {
  const tags = {};
  if (weight !== undefined && weight !== null && weight !== '') tags.PESO = String(weight);
  if (height !== undefined && height !== null && height !== '') tags.ALTURA = String(height);
  if (smoking_status) tags.SMOKING_STATUS = String(smoking_status);
  if (cigarettes_per_day !== undefined && cigarettes_per_day !== null && cigarettes_per_day !== '') tags.CIGPD = String(cigarettes_per_day);
  if (years_smoked !== undefined && years_smoked !== null && years_smoked !== '') tags.YEARSSMOKED = String(years_smoked);
  if (years_since_quit !== undefined && years_since_quit !== null && years_since_quit !== '') tags.YEARS_SINCE_QUIT = String(years_since_quit);
  if (drinks_per_week !== undefined && drinks_per_week !== null && drinks_per_week !== '') tags.DRINKS_PER_WEEK = String(drinks_per_week);
  if (binge_last_30_days) tags.BINGE_30D = String(binge_last_30_days);
  if (mod_minutes_per_week !== undefined && mod_minutes_per_week !== null && mod_minutes_per_week !== '') tags.MOD_MIN = String(mod_minutes_per_week);
  if (vig_minutes_per_week !== undefined && vig_minutes_per_week !== null && vig_minutes_per_week !== '') tags.VIG_MIN = String(vig_minutes_per_week);
  if (strength_days_per_week !== undefined && strength_days_per_week !== null && strength_days_per_week !== '') tags.STRENGTH_DPW = String(strength_days_per_week);

  const cig = Number(cigarettes_per_day);
  const yrs = Number(years_smoked);
  if (!isNaN(cig) && !isNaN(yrs) && cig > 0 && yrs > 0) {
    const packYears = (cig / 20) * yrs;
    tags.PACK_YEARS = String(packYears);
  }

  const mod = Number(mod_minutes_per_week);
  const vig = Number(vig_minutes_per_week);
  if (!isNaN(mod) && !isNaN(vig)) {
    const eq = mod + 2 * vig;
    tags.EQ_MOD_MIN = String(eq);
    tags.MEETS_WHO_PA = String(eq >= 150);
  }

  return tags;
}

// Util: conteúdo textual seguindo padrão de tags
function buildContent({ weight, height, smoking_status, cigarettes_per_day, years_smoked, years_since_quit, drinks_per_week, binge_last_30_days, mod_minutes_per_week, vig_minutes_per_week, strength_days_per_week, notes }) {
  const lines = [];
  if (weight !== undefined && weight !== null && weight !== '') lines.push(`#PESO: ${weight}`);
  if (height !== undefined && height !== null && height !== '') lines.push(`#ALTURA: ${height}`);
  if (smoking_status) lines.push(`#SMOKING_STATUS: ${smoking_status}`);
  if (cigarettes_per_day !== undefined && cigarettes_per_day !== null && cigarettes_per_day !== '') lines.push(`#CIGPD: ${cigarettes_per_day}`);
  if (years_smoked !== undefined && years_smoked !== null && years_smoked !== '') lines.push(`#YEARSSMOKED: ${years_smoked}`);
  if (years_since_quit !== undefined && years_since_quit !== null && years_since_quit !== '') lines.push(`#YEARS_SINCE_QUIT: ${years_since_quit}`);
  if (drinks_per_week !== undefined && drinks_per_week !== null && drinks_per_week !== '') lines.push(`#DRINKS_PER_WEEK: ${drinks_per_week}`);
  if (binge_last_30_days) lines.push(`#BINGE_30D: ${binge_last_30_days}`);
  if (mod_minutes_per_week !== undefined && mod_minutes_per_week !== null && mod_minutes_per_week !== '') lines.push(`#MOD_MIN: ${mod_minutes_per_week}`);
  if (vig_minutes_per_week !== undefined && vig_minutes_per_week !== null && vig_minutes_per_week !== '') lines.push(`#VIG_MIN: ${vig_minutes_per_week}`);
  if (strength_days_per_week !== undefined && strength_days_per_week !== null && strength_days_per_week !== '') lines.push(`#STRENGTH_DPW: ${strength_days_per_week}`);
  if (notes) lines.push(notes);
  return lines.join('\n');
}

// POST /api/patient-inputs
exports.createEntry = async (req, res) => {
  try {
    await ensureSynced();
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Autenticação necessária.' });
    }
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Apenas pacientes podem criar entradas.' });
    }

    const patientId = req.user.id;
    const { weight, height, smoking_status, cigarettes_per_day, years_smoked, years_since_quit, drinks_per_week, binge_last_30_days, mod_minutes_per_week, vig_minutes_per_week, strength_days_per_week, notes, metadata } = req.body || {};

    // Validar paciente existente
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Paciente não encontrado.' });
    }

    const tags = buildTags({ weight, height, smoking_status, cigarettes_per_day, years_smoked, years_since_quit, drinks_per_week, binge_last_30_days, mod_minutes_per_week, vig_minutes_per_week, strength_days_per_week });
    const content = buildContent({ weight, height, smoking_status, cigarettes_per_day, years_smoked, years_since_quit, drinks_per_week, binge_last_30_days, mod_minutes_per_week, vig_minutes_per_week, strength_days_per_week, notes });

    if (Object.keys(tags).length === 0 && !content) {
      return res.status(400).json({ message: 'Informe pelo menos um campo (peso, altura ou notas).' });
    }

    const entry = await PatientTagEntry.create({
      patient_id: patientId,
      source: 'patient',
      tags,
      content,
      metadata: metadata || {}
    });

    // Responder com entrada criada
    return res.status(201).json(entry);
  } catch (error) {
    console.error('Erro ao criar entrada do paciente:', error);
    res.status(500).json({ message: 'Erro ao criar entrada.' });
  }
};

// GET /api/patient-inputs
exports.listMyEntries = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Autenticação necessária.' });
    }
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Apenas pacientes podem listar suas entradas.' });
    }

    const patientId = req.user.id;
    const { start, end, limit = 50 } = req.query;

    const where = { patient_id: patientId };
    if (start || end) {
      const startDate = start ? new Date(start) : null;
      const endDate = end ? new Date(end) : null;
      if (startDate && endDate) {
        where.createdAt = { [Op.between]: [startDate, endDate] };
      } else if (startDate) {
        where.createdAt = { [Op.gte]: startDate };
      } else if (endDate) {
        where.createdAt = { [Op.lte]: endDate };
      }
    }

    const entries = await PatientTagEntry.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: Math.min(Number(limit) || 50, 200)
    });

    return res.json(entries);
  } catch (error) {
    console.error('Erro ao listar entradas do paciente:', error);
    res.status(500).json({ message: 'Erro ao listar entradas.' });
  }
};

// GET /api/patient-inputs/:id
exports.getEntryById = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Autenticação necessária.' });
    }
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Apenas pacientes podem acessar suas entradas.' });
    }

    const patientId = req.user.id;
    const entryId = req.params.id;

    const entry = await PatientTagEntry.findByPk(entryId);
    if (!entry || entry.patient_id !== patientId) {
      return res.status(404).json({ message: 'Entrada não encontrada.' });
    }

    return res.json(entry);
  } catch (error) {
    console.error('Erro ao buscar entrada por id:', error);
    res.status(500).json({ message: 'Erro ao buscar entrada.' });
  }
};
