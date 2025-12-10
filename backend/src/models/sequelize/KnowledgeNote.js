/**
 * Modelo de Nota de Conhecimento (Sequelize/PostgreSQL)
 * 
 * Define a estrutura de dados para notas da base de conhecimento
 * 
 * ## Integration Map
 * - **Connects To**: 
 *   - `medicos` table via ForeignKey (user_id)
 *   - `knowledge.controller.js` via import for CRUD
 * - **Data Flow**: 
 *   1. User input in Frontend (KnowledgeBase/Sidebar)
 *   2. API call to Backend
 *   3. Stored in `knowledge_notes` table
 *   4. Retrieved via `getNotes` with public/private filtering
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database-pg');

/**
 * Modelo Sequelize para KnowledgeNote
 * @class KnowledgeNote
 * @extends Model
 */
class KnowledgeNote extends Model {}

KnowledgeNote.init({
  // ID da nota (chave primária)
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // ID do usuário que criou a nota
    user_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    // Tipo do usuário (medico/patient)
    user_type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'medico'
    },
  // Conteúdo da nota
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  // Termo relacionado (busca)
  related_term: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Visibilidade pública
  is_public: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  // Nome do autor (snapshot)
  author_name: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'KnowledgeNote',
  tableName: 'knowledge_notes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['related_term']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['is_public']
    }
  ]
});

module.exports = KnowledgeNote;
