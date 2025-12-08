/**
 * Modelo de Review (Avaliações de Médicos)
 * 
 * Define a estrutura de dados para avaliações de médicos no PostgreSQL usando Sequelize
 * 
 * Connector:
 * - Usado por controllers/review.controller.js
 * - Exportado por models/sequelize/index.js
 * 
 * Hooks & Segurança:
 * - Não expõe dados sensíveis do paciente em payloads públicos
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Review = sequelize.define('Review', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    medico_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'medicos',
        key: 'id'
      }
    },
    patient_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'patients',
        key: 'id'
      }
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'reviews',
    timestamps: true,
    indexes: [
      { fields: ['medico_id'] },
      { fields: ['patient_id'] },
      { fields: ['rating'] },
      { fields: ['is_public'] }
    ]
  });

  Review.associate = (models) => {
    Review.belongsTo(models.Medico, {
      foreignKey: 'medico_id',
      as: 'medico'
    });

    Review.belongsTo(models.Patient, {
      foreignKey: 'patient_id',
      as: 'patient'
    });
  };

  return Review;
};

// Connector: Usado por marketplace.routes.js para GET/POST de avaliações