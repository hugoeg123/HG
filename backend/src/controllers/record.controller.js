/**
 * Controlador de registros médicos
 * 
 * Gerencia operações CRUD para registros médicos
 * 
 * Conector: Integra com models/Record.js para operações de banco de dados
 */

const { validationResult } = require('express-validator');
const { Record, Patient, Tag, Medico, Alert, PatientVitalSigns } = require('../models');
const { Op } = require('sequelize');
const { calculateAlerts, extractVitals } = require('../utils/vitalSignParser');
const { parseSections } = require('../../../shared/parser');
const vectorIndexer = require('../services/rag/VectorIndexer');
const patientAnonymizer = require('../services/anonymizer/PatientAnonymizer');

// Obter todos os registros de um paciente
exports.getPatientRecords = async (req, res) => {
  try {
    const patientId = req.params.patientId;

    // Verificar se o paciente existe
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Paciente não encontrado' });
    }

    // Opções de paginação
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Opções de ordenação
    const sortField = req.query.sortField || 'date';
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Opções de filtro
    const where = { patientId, isDeleted: false };

    if (req.query.type) {
      where.type = req.query.type;
    }

    if (req.query.startDate && req.query.endDate) {
      const { Op } = require('sequelize');
      where.date = {
        [Op.gte]: new Date(req.query.startDate),
        [Op.lte]: new Date(req.query.endDate)
      };
    } else if (req.query.startDate) {
      const { Op } = require('sequelize');
      where.date = { [Op.gte]: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      const { Op } = require('sequelize');
      where.date = { [Op.lte]: new Date(req.query.endDate) };
    }

    if (req.query.search) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { content: { [Op.iLike]: `%${req.query.search}%` } },
        { type: { [Op.iLike]: `%${req.query.search}%` } }
      ];
    }

    // Executar consulta com include do médico criador
    const { count, rows } = await Record.findAndCountAll({
      where,
      order: [[sortField, sortOrder]],
      limit,
      offset,
      include: [{ model: Medico, as: 'medicoCriador', attributes: ['id', 'nome', 'professional_id'] }]
    });

    // Formatar dados com informações do médico
    const records = rows.map(r => {
      const json = r.toJSON();

      return {
        ...json,
        // 🔁 Padrão: doctorName = só o nome; CRM separado.
        doctorName: json.medicoCriador?.nome || null,
        doctorCRM: json.medicoCriador?.professional_id || null
      };
    });

    res.json({
      records,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar registros:', error);
    res.status(500).json({ message: 'Erro ao buscar registros' });
  }
};

// Obter registro por ID
exports.getRecordById = async (req, res) => {
  try {
    const record = await Record.findOne({
      where: {
        id: req.params.id,
        isDeleted: false
      },
      include: [{ model: Medico, as: 'medicoCriador', attributes: ['id', 'nome', 'professional_id'] }]
    });

    if (!record) {
      return res.status(404).json({ message: 'Registro não encontrado' });
    }

    // Formatar dados com informações do médico separadas
    const json = record.toJSON();
    const formattedRecord = {
      ...json,
      // 🔁 Padrão: doctorName = só o nome; CRM separado.
      doctorName: json.medicoCriador?.nome || null,
      doctorCRM: json.medicoCriador?.professional_id || null
    };

    res.json(formattedRecord);
  } catch (error) {
    console.error('Erro ao buscar registro:', error);
    res.status(500).json({ message: 'Erro ao buscar registro' });
  }
};

// Criar novo registro
exports.createRecord = async (req, res) => {
  try {
    console.log('🔍 Debug - createRecord iniciado');
    console.log('📦 req.body completo:', JSON.stringify(req.body, null, 2));
    console.log('👤 req.user:', req.user);

    // Verificar erros de validação do express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg,
          value: err.value
        }))
      });
    }

    const { patientId, title, type, date, content, tags, attachments, metadata } = req.body;

    // Debug detalhado dos campos
    console.log('🔍 Campos extraídos:');
    console.log('  - patientId:', patientId, typeof patientId);
    console.log('  - title:', title, typeof title);
    console.log('  - type:', type, typeof type);
    console.log('  - content:', content, typeof content, 'length:', content?.length);
    console.log('  - date:', date);
    console.log('  - tags:', tags);
    console.log('  - attachments:', attachments);
    console.log('  - metadata:', metadata);

    // Verificar se req.user está definido
    if (!req.user || !req.user.id) {
      console.error('req.user não está definido ou não possui ID');
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    // Verificar se o paciente existe
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado'
      });
    }

    // Verificar se as tags existem
    if (tags && tags.length > 0) {
      const tagIds = tags.map(tag => tag.tagId || tag.id);
      const existingTags = await Tag.findAll({ where: { id: { [Op.in]: tagIds } } });

      if (existingTags.length !== tagIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Uma ou mais tags não existem'
        });
      }
    }

    // Criar registro
    const record = await Record.create({
      patientId,
      title,
      type,
      date: date || new Date(),
      content,
      tags: tags || [],
      attachments: attachments || [],
      metadata: metadata || {},
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    console.log('Registro criado com sucesso:', record.id);

    // --- AUTOMATIC VITAL SIGN & ALERT PROCESSING ---
    try {
      // Fetch all tags for parsing
      const allTags = await Tag.findAll();

      // Use shared parser to extract structured data
      // This supports >>TAG format normalized to #TAG
      let sections = [];
      try {
        sections = parseSections(content, allTags);
      } catch (parseError) {
        console.warn('ALERT_PIPELINE_PARSE_FAILED', { error: parseError.message });
      }

      if (sections.length > 0) {
        console.log('ALERT_PIPELINE_PARSE', { sections: sections.length, tagsLoaded: allTags.length });
        const vitals = {};

        // Map sections to vitals object
        sections.forEach(section => {
          const tag = allTags.find(t => t.id === section.tag_id);
          if (tag) {
            // Normalize code to canonical key without prefix (# or >>)
            const codeKey = String(tag.codigo || '')
              .replace(/^#|^>>/, '')
              .toUpperCase();

            switch (codeKey) {
              case 'PA':
                if (section.parsed_value) {
                  vitals.systolic = section.parsed_value.sistolica;
                  vitals.diastolic = section.parsed_value.diastolica;
                }
                break;
              case 'FC':
                vitals.heartRate = section.parsed_value;
                break;
              case 'FR':
                vitals.respiratoryRate = section.parsed_value;
                break;
              case 'SPO2':
                vitals.spo2 = section.parsed_value;
                break;
              case 'TEMP':
                vitals.temp = section.parsed_value;
                break;
            }
          }
        });

        const hasVitals = Object.keys(vitals).length > 0;

        if (hasVitals) {
          console.log('ALERT_PIPELINE_VITALS', vitals);

          // 1. Save to PatientVitalSigns
          await PatientVitalSigns.create({
            patient_id: patientId,
            systolic_bp: vitals.systolic,
            diastolic_bp: vitals.diastolic,
            heart_rate: vitals.heartRate,
            respiratory_rate: vitals.respiratoryRate,
            spo2: vitals.spo2,
            temperature: vitals.temp,
            recorded_at: date || new Date(),
            recorded_by: req.user.id,
            source: 'record_extraction',
            notes: `Extraído do registro: ${record.id}`
          });

          // 2. Check for Alerts
          // LOGIC MOVED TO PatientVitalSigns MODEL HOOK
          /*
          const alerts = calculateAlerts(vitals);
          if (alerts.length > 0) {
            console.log('ALERT_PIPELINE_CREATED', { count: alerts.length });

            for (const alertDef of alerts) {
              try {
                const created = await Alert.create({
                  user_id: req.user.id,
                  record_id: record.id,
                  message: alertDef.message,
                  severity: alertDef.type,
                  is_read: false
                });
                console.log('ALERT_PIPELINE_CREATE_OK', { id: created.id, severity: created.severity });
              } catch (createErr) {
                console.error('ALERT_PIPELINE_CREATE_ERROR', { error: createErr.message });
              }
            }
          }
          */
        }
      } else {
        // Fallback: regex-based extraction if structured sections not found
        const fallbackVitals = extractVitals(content);
        if (Object.keys(fallbackVitals).length > 0) {
          console.log('ALERT_PIPELINE_VITALS', fallbackVitals);

          await PatientVitalSigns.create({
            patient_id: patientId,
            systolic_bp: fallbackVitals.systolic,
            diastolic_bp: fallbackVitals.diastolic,
            heart_rate: fallbackVitals.heartRate,
            respiratory_rate: fallbackVitals.respiratoryRate,
            spo2: fallbackVitals.spo2,
            temperature: fallbackVitals.temp,
            recorded_at: date || new Date(),
            recorded_by: req.user.id,
            source: 'record_extraction',
            notes: `Extraído do registro: ${record.id}`
          });

          const alerts = calculateAlerts(fallbackVitals);
          if (alerts.length > 0) {
            console.log('ALERT_PIPELINE_CREATED', { count: alerts.length });
            for (const alertDef of alerts) {
              try {
                const created = await Alert.create({
                  user_id: req.user.id,
                  record_id: record.id,
                  message: alertDef.message,
                  severity: alertDef.type,
                  is_read: false
                });
                console.log('ALERT_PIPELINE_CREATE_OK', { id: created.id, severity: created.severity });
              } catch (createErr) {
                console.error('ALERT_PIPELINE_CREATE_ERROR', { error: createErr.message });
              }
            }
          }
        } else {
          console.log('ALERT_PIPELINE_VITALS_NONE');
        }
      }
    } catch (vitalsError) {
      console.error('ALERT_PIPELINE_ERROR', { error: vitalsError.message });
      // Don't block record creation success
    }
    // -----------------------------------------------

    // Buscar o registro criado com informações do médico
    const recordWithDoctor = await Record.findByPk(record.id, {
      include: [{ model: Medico, as: 'medicoCriador', attributes: ['id', 'nome', 'professional_id'] }]
    });

    // Formatar dados com informações do médico separadas
    const json = recordWithDoctor.toJSON();
    const formattedRecord = {
      ...json,
      // 🔁 Padrão: doctorName = só o nome; CRM separado.
      doctorName: json.medicoCriador?.nome || null,
      doctorCRM: json.medicoCriador?.professional_id || null
    };

    // Notify clients about the update
    try {
      const { getSocketService } = require('../services/socket.registry');
      const socketService = getSocketService();
      if (socketService) {
        socketService.sendToRoom(`patient:${patientId}`, `patient:${patientId}:update`, {
          type: 'record',
          recordId: record.id
        });
      }
    } catch (sockErr) {
      console.warn('Socket emit failed:', sockErr.message);
    }

    // --- RAG INDEXING HOOK ---
    // Fire-and-forget indexing in background
    (async () => {
      try {
        console.log(`[RAG] Triggering indexing for patient ${patientId}...`);
        const anonymizedData = await patientAnonymizer.getAnonymizedPatientData(patientId);
        await vectorIndexer.indexPatient(anonymizedData);
        console.log(`[RAG] Indexing triggered successfully for patient ${patientId}`);
      } catch (ragError) {
        console.error('[RAG] Indexing Trigger Error:', ragError);
      }
    })();
    // -------------------------

    res.status(201).json({
      success: true,
      message: 'Registro criado com sucesso',
      data: formattedRecord
    });
  } catch (error) {
    console.error('Erro ao criar registro:', error);

    // Verificar se é erro de validação do Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message,
          value: err.value
        }))
      });
    }

    // Verificar se é erro de chave estrangeira
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Referência inválida - verifique se o paciente existe'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao criar registro'
    });
  }
};

// Atualizar registro
exports.updateRecord = async (req, res) => {
  try {
    console.log('Debug - updateRecord req.user:', req.user);

    // Verificar erros de validação do express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg,
          value: err.value
        }))
      });
    }

    // Verificar se req.user está definido
    if (!req.user || !req.user.id) {
      console.error('req.user não está definido ou não possui ID');
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    const { title, type, date, content, tags, attachments, metadata } = req.body;

    // Verificar se as tags existem
    if (tags && tags.length > 0) {
      const tagIds = tags.map(tag => tag.tagId || tag.id);
      const existingTags = await Tag.findAll({ where: { id: { [Op.in]: tagIds } } });

      if (existingTags.length !== tagIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Uma ou mais tags não existem'
        });
      }
    }

    // Buscar registro
    const record = await Record.findOne({
      where: {
        id: req.params.id,
        isDeleted: false
      }
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Registro não encontrado'
      });
    }

    // Preparar dados para atualização (apenas campos fornecidos)
    const updateData = {
      updatedBy: req.user.id
    };

    if (title !== undefined) updateData.title = title;
    if (type !== undefined) updateData.type = type;
    if (date !== undefined) updateData.date = date;
    if (content !== undefined) updateData.content = content;
    if (tags !== undefined) updateData.tags = tags;
    if (attachments !== undefined) updateData.attachments = attachments;
    if (metadata !== undefined) updateData.metadata = metadata;

    // Atualizar registro
    await record.update(updateData);

    console.log('Registro atualizado com sucesso:', record.id);

    // --- RAG INDEXING HOOK ---
    // Fire-and-forget indexing (using record.patientId which is immutable usually, or fetch from record)
    (async () => {
      try {
        console.log(`[RAG] Triggering re-indexing for patient ${record.patientId}...`);
        const anonymizedData = await patientAnonymizer.getAnonymizedPatientData(record.patientId);
        await vectorIndexer.indexPatient(anonymizedData);
        console.log(`[RAG] Re-indexing triggered successfully for patient ${record.patientId}`);
      } catch (ragError) {
        console.error('[RAG] Re-indexing Trigger Error:', ragError);
      }
    })();
    // -------------------------

    res.json({
      success: true,
      message: 'Registro atualizado com sucesso',
      data: record
    });
  } catch (error) {
    console.error('Erro ao atualizar registro:', error);

    // Verificar se é erro de validação do Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message,
          value: err.value
        }))
      });
    }

    // Verificar se é erro de chave estrangeira
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Referência inválida'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao atualizar registro'
    });
  }
};

// Excluir registro (exclusão lógica)
exports.deleteRecord = async (req, res) => {
  try {
    const record = await Record.findOne({
      where: {
        id: req.params.id,
        isDeleted: false
      }
    });

    if (!record) {
      return res.status(404).json({ message: 'Registro não encontrado' });
    }

    await record.update({
      isDeleted: true,
      updatedBy: req.user.id
    });

    res.json({
      message: 'Registro excluído com sucesso',
      record
    });
  } catch (error) {
    console.error('Erro ao excluir registro:', error);
    res.status(500).json({ message: 'Erro ao excluir registro' });
  }
};

// Buscar registros por tag
exports.getRecordsByTag = async (req, res) => {
  try {
    const tagId = req.params.tagId;

    // Verificar se a tag existe
    const tag = await Tag.findByPk(tagId);
    if (!tag) {
      return res.status(404).json({ message: 'Tag não encontrada' });
    }

    // Opções de paginação
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Opções de ordenação
    const sortField = req.query.sortField || 'date';
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Filtro por tag
    const { Op } = require('sequelize');
    const where = {
      tags: {
        [Op.contains]: [{ tagId }]
      },
      isDeleted: false
    };

    // Adicionar filtro por paciente se fornecido
    if (req.query.patientId) {
      where.patientId = req.query.patientId;
    }

    // Executar consulta
    const { count, rows: records } = await Record.findAndCountAll({
      where,
      order: [[sortField, sortOrder]],
      offset,
      limit
    });

    res.json({
      records,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar registros por tag:', error);
    res.status(500).json({ message: 'Erro ao buscar registros por tag' });
  }
};

// Buscar registros por tipo
exports.getRecordsByType = async (req, res) => {
  try {
    const type = req.params.type;

    // Opções de paginação
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Opções de ordenação
    const sortField = req.query.sortField || 'date';
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Filtro por tipo
    const where = {
      type,
      isDeleted: false
    };

    // Adicionar filtro por paciente se fornecido
    if (req.query.patientId) {
      where.patientId = req.query.patientId;
    }

    // Executar consulta
    const { count, rows: records } = await Record.findAndCountAll({
      where,
      order: [[sortField, sortOrder]],
      offset,
      limit
    });

    res.json({
      records,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar registros por tipo:', error);
    res.status(500).json({ message: 'Erro ao buscar registros por tipo' });
  }
};
