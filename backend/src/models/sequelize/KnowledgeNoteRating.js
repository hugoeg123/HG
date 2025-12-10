const { Model, DataTypes } = require('sequelize');

class KnowledgeNoteRating extends Model {
  static init(sequelize) {
    super.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      note_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5
        }
      }
    }, {
      sequelize,
      tableName: 'knowledge_note_ratings',
      timestamps: true,
      underscored: true
    });
  }

  static associate(models) {
    this.belongsTo(models.KnowledgeNote, { foreignKey: 'note_id', as: 'note' });
    this.belongsTo(models.Medico, { foreignKey: 'user_id', as: 'user' });
  }
}

module.exports = KnowledgeNoteRating;
