const { Model, DataTypes } = require('sequelize');

class KnowledgeNoteComment extends Model {
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
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      }
    }, {
      sequelize,
      tableName: 'knowledge_note_comments',
      timestamps: true,
      underscored: true
    });
  }

  static associate(models) {
    this.belongsTo(models.KnowledgeNote, { foreignKey: 'note_id', as: 'note' });
    this.belongsTo(models.Medico, { foreignKey: 'user_id', as: 'user' });
  }
}

module.exports = KnowledgeNoteComment;
