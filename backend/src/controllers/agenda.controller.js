/**
 * Controlador de Agenda
 * 
 * CRUD de AvailabilitySlot (disponibilidades) e Appointment (agendamentos)
 * Alinha com o frontend que usa status: available, booked, blocked e modalidades: presencial, telemedicina
 */

const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { AvailabilitySlot, Appointment, Medico, Patient } = require('../models/sequelize');

// Utilitário: verifica sobreposição de slots
const overlaps = (aStart, aEnd, bStart, bEnd) => {
  return (aStart < bEnd) && (bStart < aEnd);
};

// Listar slots do médico logado com filtros
exports.getSlots = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Autenticação necessária.' });
    }

    const medicoId = req.user.id;
    const where = { medico_id: medicoId };

    // Filtros opcionais
    const { start, end, status, modality } = req.query;
    if (status) where.status = status;
    if (modality) where.modality = modality;
    if (start || end) {
      // Slots que intersectam intervalo [start, end]
      const startDate = start ? new Date(start) : null;
      const endDate = end ? new Date(end) : null;
      if (startDate && endDate) {
        where[Op.and] = [
          { start_time: { [Op.lt]: endDate } },
          { end_time: { [Op.gt]: startDate } }
        ];
      } else if (startDate) {
        where.end_time = { [Op.gt]: startDate };
      } else if (endDate) {
        where.start_time = { [Op.lt]: endDate };
      }
    }

    const slots = await AvailabilitySlot.findAll({
      where,
      order: [['start_time', 'ASC']],
      include: [
        { model: Appointment, as: 'appointments' },
        { model: Medico, as: 'medico', attributes: ['id', 'nome'] }
      ]
    });

    res.json(slots);
  } catch (error) {
    console.error('Erro ao listar slots:', error);
    res.status(500).json({ message: 'Erro ao listar slots' });
  }
};

// Criar novo slot para o médico autenticado
exports.createSlot = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Autenticação necessária.' });
    }

    const medicoId = req.user.id;
    const { start_time, end_time, modality, location, notes } = req.body;

    const startDate = new Date(start_time);
    const endDate = new Date(end_time);
    if (!(startDate instanceof Date) || isNaN(startDate) || !(endDate instanceof Date) || isNaN(endDate)) {
      return res.status(400).json({ message: 'Datas inválidas.' });
    }
    if (endDate <= startDate) {
      return res.status(400).json({ message: 'Horário final deve ser maior que o inicial.' });
    }

    // Verificar sobreposição com slots existentes do médico
    const existing = await AvailabilitySlot.findAll({
      where: {
        medico_id: medicoId,
        [Op.and]: [
          { start_time: { [Op.lt]: endDate } },
          { end_time: { [Op.gt]: startDate } }
        ]
      }
    });
    if (existing && existing.length > 0) {
      return res.status(409).json({ message: 'Conflito: Já existe slot que sobrepõe esse intervalo.' });
    }

    const slot = await AvailabilitySlot.create({
      medico_id: medicoId,
      start_time: startDate,
      end_time: endDate,
      status: 'available',
      modality: modality || 'presencial',
      location: location || null,
      notes: notes || null
    });

    res.status(201).json(slot);
  } catch (error) {
    console.error('Erro ao criar slot:', error);
    res.status(500).json({ message: 'Erro ao criar slot' });
  }
};

// Atualizar slot
exports.updateSlot = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Autenticação necessária.' });
    }

    const slotId = req.params.id;
    const slot = await AvailabilitySlot.findByPk(slotId, { include: [{ model: Appointment, as: 'appointments' }] });
    if (!slot) return res.status(404).json({ message: 'Slot não encontrado' });
    if (slot.medico_id !== req.user.id) return res.status(403).json({ message: 'Acesso negado ao slot.' });

    const updates = {};
    const { start_time, end_time, status, modality, location, notes } = req.body;

    if (start_time || end_time) {
      const newStart = start_time ? new Date(start_time) : new Date(slot.start_time);
      const newEnd = end_time ? new Date(end_time) : new Date(slot.end_time);
      if (newEnd <= newStart) {
        return res.status(400).json({ message: 'Horário final deve ser maior que o inicial.' });
      }
      // Verificar sobreposição com outros slots do médico
      const conflicting = await AvailabilitySlot.findAll({
        where: {
          medico_id: slot.medico_id,
          id: { [Op.ne]: slot.id },
          [Op.and]: [
            { start_time: { [Op.lt]: newEnd } },
            { end_time: { [Op.gt]: newStart } }
          ]
        }
      });
      if (conflicting.length > 0) {
        return res.status(409).json({ message: 'Conflito: Atualização sobrepõe outro slot.' });
      }
      updates.start_time = newStart;
      updates.end_time = newEnd;
    }

    if (status) {
      if (!['available', 'booked', 'blocked'].includes(status)) {
        return res.status(400).json({ message: 'Status inválido.' });
      }
      if (status === 'blocked' && slot.appointments?.length > 0) {
        return res.status(400).json({ message: 'Não é possível bloquear um slot com agendamento.' });
      }
      updates.status = status;
    }

    if (modality) {
      if (!['presencial', 'telemedicina', 'domiciliar'].includes(modality)) {
        return res.status(400).json({ message: 'Modalidade inválida.' });
      }
      updates.modality = modality;
    }

    if (location !== undefined) updates.location = location;
    if (notes !== undefined) updates.notes = notes;

    await slot.update(updates);
    res.json(slot);
  } catch (error) {
    console.error('Erro ao atualizar slot:', error);
    res.status(500).json({ message: 'Erro ao atualizar slot' });
  }
};

// Remover slot
exports.deleteSlot = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Autenticação necessária.' });
    }

    const slotId = req.params.id;
    const slot = await AvailabilitySlot.findByPk(slotId, { include: [{ model: Appointment, as: 'appointments' }] });
    if (!slot) return res.status(404).json({ message: 'Slot não encontrado' });
    if (slot.medico_id !== req.user.id) return res.status(403).json({ message: 'Acesso negado ao slot.' });

    if (slot.appointments && slot.appointments.some(a => a.status === 'booked')) {
      return res.status(400).json({ message: 'Slot possui agendamento ativo. Cancele o agendamento antes de remover.' });
    }

    await slot.destroy();
    res.json({ message: 'Slot removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover slot:', error);
    res.status(500).json({ message: 'Erro ao remover slot' });
  }
};

// Listar agendamentos
exports.getAppointments = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Autenticação necessária.' });
    }

    const where = {};
    const { status, patientId, start, end } = req.query;
    if (status) where.status = status;
    if (patientId) where.patient_id = patientId;

    // Filtrar por intervalo via slot
    const slotWhere = {};
    if (start || end) {
      const startDate = start ? new Date(start) : null;
      const endDate = end ? new Date(end) : null;
      if (startDate && endDate) {
        slotWhere[Op.and] = [
          { start_time: { [Op.lt]: endDate } },
          { end_time: { [Op.gt]: startDate } }
        ];
      } else if (startDate) {
        slotWhere.end_time = { [Op.gt]: startDate };
      } else if (endDate) {
        slotWhere.start_time = { [Op.lt]: endDate };
      }
    }

    // Apenas agendamentos dos slots do médico logado
    const appointments = await Appointment.findAll({
      where,
      include: [
        { model: AvailabilitySlot, as: 'slot', where: { medico_id: req.user.id, ...slotWhere } },
        { model: Patient, as: 'patient', attributes: ['id', 'name'] }
      ],
      order: [[{ model: AvailabilitySlot, as: 'slot' }, 'start_time', 'ASC']]
    });

    res.json(appointments);
  } catch (error) {
    console.error('Erro ao listar agendamentos:', error);
    res.status(500).json({ message: 'Erro ao listar agendamentos' });
  }
};

// Listar agendamentos do paciente autenticado
// Connector: Usado pelo frontend AgendaSummary (paciente) via /agenda/my-appointments
exports.getMyAppointments = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Autenticação necessária.' });
    }
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Acesso restrito a pacientes.' });
    }

    const where = { patient_id: req.user.id };
    const { status, start, end } = req.query;
    if (status) where.status = status;

    // Filtrar por intervalo via slot
    const slotWhere = {};
    if (start || end) {
      const startDate = start ? new Date(start) : null;
      const endDate = end ? new Date(end) : null;
      if (startDate && endDate) {
        slotWhere[Op.and] = [
          { start_time: { [Op.lt]: endDate } },
          { end_time: { [Op.gt]: startDate } }
        ];
      } else if (startDate) {
        slotWhere.end_time = { [Op.gt]: startDate };
      } else if (endDate) {
        slotWhere.start_time = { [Op.lt]: endDate };
      }
    }

    const appointments = await Appointment.findAll({
      where,
      include: [
        { 
          model: AvailabilitySlot, 
          as: 'slot', 
          where: slotWhere, 
          include: [{ model: Medico, as: 'medico', attributes: ['id', 'nome'] }] 
        },
        { model: Patient, as: 'patient', attributes: ['id', 'name'] }
      ],
      order: [[{ model: AvailabilitySlot, as: 'slot' }, 'start_time', 'ASC']]
    });

    res.json({ data: appointments });
  } catch (error) {
    console.error('Erro ao listar meus agendamentos:', error);
    res.status(500).json({ message: 'Erro ao listar meus agendamentos' });
  }
};

// Criar agendamento
// Hook: Ao criar, notifica médico via socket.service (socket.registry)
exports.createAppointment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Autenticação necessária.' });
    }

    const { slot_id, patient_id, notes } = req.body;
    const slot = await AvailabilitySlot.findByPk(slot_id, { include: [{ model: Appointment, as: 'appointments' }] });
    if (!slot) return res.status(404).json({ message: 'Slot não encontrado' });
    // Autorização: médico só pode criar para seus slots; paciente pode agendar se for o próprio paciente
    if (req.user.role === 'medico') {
      if (slot.medico_id !== req.user.id) {
        return res.status(403).json({ message: 'Acesso negado ao slot.' });
      }
    } else if (req.user.role === 'patient') {
      if (patient_id !== req.user.id) {
        return res.status(403).json({ message: 'Paciente autenticado deve corresponder ao patient_id.' });
      }
      // Para paciente, permitir agendamento em slots de qualquer médico, desde que disponível
    } else {
      return res.status(403).json({ message: 'Perfil de usuário não autorizado para agendar.' });
    }

    if (slot.status !== 'available') {
      return res.status(400).json({ message: 'Slot não está disponível para agendamento.' });
    }

    const patient = await Patient.findByPk(patient_id);
    if (!patient) return res.status(404).json({ message: 'Paciente não encontrado' });

    // Define booking origin based on user role
    const origin = (req.user.role === 'patient')
      ? 'patient_marketplace'
      : (req.user.role === 'medico' ? 'doctor_manual' : 'system');

    // Criação de agendamento com origem; fallback defensivo se coluna não existir
    let appointment;
    try {
      appointment = await Appointment.create({
        slot_id,
        patient_id,
        status: 'booked',
        notes: notes || null,
        origin
      });
    } catch (dbErr) {
      // Fallback: se o erro indicar coluna ausente (migração não aplicada), criar sem 'origin'
      const msg = String(dbErr?.message || '').toLowerCase();
      const isUndefinedColumn = msg.includes('column') && msg.includes('origin') && msg.includes('does not exist');
      const isPgUndefinedColumnCode = dbErr?.parent?.code === '42703';
      if (isUndefinedColumn || isPgUndefinedColumnCode) {
        console.warn('[appointments.origin missing] Criando agendamento sem coluna origin. Execute migrations.', {
          code: dbErr?.parent?.code,
          detail: dbErr?.parent?.detail || dbErr?.message
        });
        appointment = await Appointment.create({
          slot_id,
          patient_id,
          status: 'booked',
          notes: notes || null
        });
      } else {
        throw dbErr;
      }
    }

    await slot.update({ status: 'booked' });
    
    // Notificar médico do slot via Socket.io (se disponível)
    try {
      const { getSocketService } = require('../services/socket.registry');
      const socketService = getSocketService && getSocketService();
      if (socketService && slot.medico_id) {
        socketService.sendToUser(slot.medico_id, 'notification', {
          type: 'appointment:new',
          appointmentId: appointment.id,
          slotId: slot.id,
          patientId: patient.id,
          patientName: patient.name,
          slot: { start_time: slot.start_time, end_time: slot.end_time },
          message: `Novo agendamento criado pelo paciente ${patient.name || patient.id}.`,
          createdAt: new Date().toISOString()
        });
      }
    } catch (notifyErr) {
      console.warn('Falha ao enviar notificação de agendamento:', notifyErr?.message);
    }

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(500).json({ message: 'Erro ao criar agendamento' });
  }
};

// Atualizar agendamento
// Hook: Ao cancelar um agendamento de origem marketplace, notifica o paciente via socket.service
exports.updateAppointment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Autenticação necessária.' });
    }

    const id = req.params.id;
    const appointment = await Appointment.findByPk(id, { include: [
      { model: AvailabilitySlot, as: 'slot' },
      { model: Patient, as: 'patient', attributes: ['id', 'name'] }
    ] });
    if (!appointment) return res.status(404).json({ message: 'Agendamento não encontrado' });
    if (appointment.slot.medico_id !== req.user.id) return res.status(403).json({ message: 'Acesso negado ao agendamento.' });

    const { status, notes } = req.body;
    const updates = {};

    if (status) {
      if (!['booked', 'cancelled', 'completed', 'no_show'].includes(status)) {
        return res.status(400).json({ message: 'Status inválido.' });
      }
      updates.status = status;
    }

    if (notes !== undefined) updates.notes = notes;

    await appointment.update(updates);

    // Se cancelado e nenhum outro agendamento para o slot, liberar slot
    if (status === 'cancelled') {
      const count = await Appointment.count({ where: { slot_id: appointment.slot_id, status: 'booked' } });
      if (count === 0) {
        await appointment.slot.update({ status: 'available' });
      }

      // Notificar paciente se for cancelamento de origem marketplace
      try {
        const origin = appointment?.origin || null;
        if (origin === 'patient_marketplace' && appointment?.patient_id) {
          const { getSocketService } = require('../services/socket.registry');
          const socketService = getSocketService && getSocketService();
          if (socketService) {
            socketService.sendToUser(appointment.patient_id, 'notification', {
              type: 'appointment:cancelled_by_doctor',
              appointmentId: appointment.id,
              slotId: appointment.slot_id,
              slot: { start_time: appointment.slot?.start_time, end_time: appointment.slot?.end_time },
              message: `Sua consulta foi cancelada pelo médico.`,
              createdAt: new Date().toISOString()
            });
          }
        }
      } catch (notifyErr) {
        console.warn('Falha ao notificar paciente sobre cancelamento:', notifyErr?.message);
      }
    }

    res.json(appointment);
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    res.status(500).json({ message: 'Erro ao atualizar agendamento' });
  }
};

// Remover agendamento
exports.deleteAppointment = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Autenticação necessária.' });
    }

    const id = req.params.id;
    const appointment = await Appointment.findByPk(id, { include: [{ model: AvailabilitySlot, as: 'slot' }] });
    if (!appointment) return res.status(404).json({ message: 'Agendamento não encontrado' });
    if (appointment.slot.medico_id !== req.user.id) return res.status(403).json({ message: 'Acesso negado ao agendamento.' });

    await appointment.destroy();

    const count = await Appointment.count({ where: { slot_id: appointment.slot_id, status: 'booked' } });
    if (count === 0) {
      await appointment.slot.update({ status: 'available' });
    }

    res.json({ message: 'Agendamento removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover agendamento:', error);
    res.status(500).json({ message: 'Erro ao remover agendamento' });
  }
};