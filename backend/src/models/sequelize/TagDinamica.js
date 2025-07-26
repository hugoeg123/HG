/**
 * Modelo Sequelize para Tags Dinâmicas
 * 
 * MISSÃO ZERO-DÉBITO: Tags como variáveis estruturadas
 * com validação, hierarquia e isolamento por médico
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TagDinamica = sequelize.define('TagDinamica', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    medico_id: {
      type: DataTypes.UUID,
      allowNull: true, // NULL = tag global
      references: {
        model: 'medicos',
        key: 'id'
      }
    },
    parent_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'tags',
        key: 'id'
      }
    },
    codigo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        is: /^#\w+|>>\w+/,
        len: [2, 50]
      }
    },
    nome: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [1, 255]
      }
    },
    tipo_dado: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        isIn: [['texto', 'numero', 'data', 'booleano', 'bp']]
      }
    },
    regras_validacao: {
      type: DataTypes.JSONB,
      defaultValue: {},
      validate: {
        isValidJSON(value) {
          if (typeof value !== 'object') {
            throw new Error('Regras de validação devem ser um objeto JSON válido');
          }
        }
      }
    }
  }, {
    tableName: 'tags',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['medico_id', 'codigo'],
        name: 'tags_medico_codigo_unique'
      },
      {
        fields: ['medico_id', 'codigo'],
        name: 'idx_tags_medico_codigo'
      },
      {
        fields: ['parent_id']
      },
      {
        fields: ['tipo_dado']
      }
    ],
    validate: {
      // Validação customizada para códigos de tag
      validarCodigo() {
        if (!this.codigo.match(/^(#\w+|>>\w+)$/)) {
          throw new Error('Código deve começar com # ou >> seguido de caracteres alfanuméricos');
        }
      },
      
      // Validação para tags filhas
      validarHierarquia() {
        if (this.parent_id && this.codigo.startsWith('#')) {
          throw new Error('Tags principais (#) não podem ter parent_id');
        }
        if (!this.parent_id && this.codigo.startsWith('>>')) {
          throw new Error('Subtags (>>) devem ter um parent_id');
        }
      }
    }
  });

  TagDinamica.associate = (models) => {
    // Relacionamento com médico (criador da tag)
    TagDinamica.belongsTo(models.Medico, {
      foreignKey: 'medico_id',
      as: 'medico'
    });

    // Auto-relacionamento para hierarquia de tags
    TagDinamica.belongsTo(TagDinamica, {
      foreignKey: 'parent_id',
      as: 'parent'
    });

    TagDinamica.hasMany(TagDinamica, {
      foreignKey: 'parent_id',
      as: 'children'
    });

    // Relacionamento com seções de registro
    TagDinamica.hasMany(models.SecaoRegistro, {
      foreignKey: 'tag_id',
      as: 'secoes'
    });
  };

  // Métodos de classe
  TagDinamica.getTagsForMedico = async function(medicoId) {
    return await this.findAll({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { medico_id: medicoId },
          { medico_id: null } // Tags globais
        ]
      },
      include: [
        {
          model: TagDinamica,
          as: 'children',
          required: false
        }
      ],
      order: [['codigo', 'ASC']]
    });
  };

  TagDinamica.getTagsByCodigos = async function(codigos, medicoId = null) {
    const whereClause = {
      codigo: {
        [sequelize.Sequelize.Op.in]: codigos
      }
    };

    if (medicoId) {
      whereClause[sequelize.Sequelize.Op.or] = [
        { medico_id: medicoId },
        { medico_id: null }
      ];
    }

    return await this.findAll({
      where: whereClause
    });
  };

  // Métodos de instância
  TagDinamica.prototype.isGlobal = function() {
    return this.medico_id === null;
  };

  TagDinamica.prototype.isMainTag = function() {
    return this.codigo.startsWith('#');
  };

  TagDinamica.prototype.isSubTag = function() {
    return this.codigo.startsWith('>>');
  };

  TagDinamica.prototype.getValidationRules = function() {
    return this.regras_validacao || {};
  };

  return TagDinamica;
};