/**
 * Review Controller
 *
 * Connectors:
 * - Uses Medico and Review models from sequelize index
 * - Public GET: lists public reviews for publicly visible doctors
 * - Patient POST: creates a review linked to authenticated patient
 *
 * Hook: Mounted by marketplace.routes.js under /marketplace/medicos/:id/reviews
 */

const { validationResult } = require("express-validator");
const { Medico, Review } = require("../models/sequelize");

/**
 * List public reviews for a public doctor
 */
async function listPublicReviews(req, res, next) {
  try {
    const { id } = req.params;

    const medico = await Medico.findOne({
      where: { id, public_visibility: true },
      attributes: ["id", "nome"],
    });
    if (!medico) {
      return res.status(404).json({ message: "Medico não encontrado ou não público" });
    }

    const reviews = await Review.findAll({
      where: { medico_id: id, is_public: true },
      order: [["createdAt", "DESC"]],
      attributes: ["id", "rating", "comment", "createdAt"],
    });

    return res.json({ medico: { id: medico.id, nome: medico.nome }, reviews });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a review for a doctor by an authenticated patient
 */
async function createReview(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { rating, comment, is_public = true } = req.body;
    const user = req.user;

    if (!user || user.role !== "patient") {
      return res.status(403).json({ message: "Permissão insuficiente" });
    }

    const medico = await Medico.findByPk(id);
    if (!medico) {
      return res.status(404).json({ message: "Medico não encontrado" });
    }

    const review = await Review.create({
      medico_id: id,
      patient_id: user.id,
      rating,
      comment,
      is_public: Boolean(is_public),
    });

    return res.status(201).json({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listPublicReviews,
  createReview,
};