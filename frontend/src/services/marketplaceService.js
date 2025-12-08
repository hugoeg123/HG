/**
 * Marketplace Service
 * 
 * Conecta aos endpoints públicos:
 * - GET /marketplace/medicos
 * - GET /marketplace/medicos/:id
 * - GET /marketplace/slots?medico_id=...
 * 
 * Connector: Consumido pela página pública DoctorsList.jsx
 * Segurança: Endpoints públicos; sem token necessário
 */

import api from './api';

export async function getPublicDoctors(params = {}) {
  const response = await api.get('/marketplace/medicos', { params });
  return response.data; // { page, limit, total, data: Doctor[] }
}

export async function getDoctorById(id) {
  const response = await api.get(`/marketplace/medicos/${id}`);
  return response.data; // Doctor
}

export async function getAvailableSlots({ medico_id, start, end, modality } = {}) {
  const response = await api.get('/marketplace/slots', {
    params: { medico_id, start, end, modality }
  });
  return response.data; // Slot[]
}

// GET /marketplace/medicos/:id/reviews - avaliações públicas
export async function getDoctorReviews(id) {
  const response = await api.get(`/marketplace/medicos/${id}/reviews`);
  return response.data; // { medico: { id, nome }, reviews: [{ id, rating, comment, createdAt }] }
}

// POST /marketplace/medicos/:id/reviews - criar avaliação (requer token de paciente)
export async function createDoctorReview(id, { rating, comment, is_public = true }) {
  const response = await api.post(`/marketplace/medicos/${id}/reviews`, { rating, comment, is_public });
  return response.data; // created review
}