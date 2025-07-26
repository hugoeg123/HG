/**
 * Modelo Sequelize para Seções de Registro
 * 
 * MISSÃO ZERO-DÉBITO: Tabela de junção normalizada
 * para dados estruturados com otimização para IA
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SecaoRegistro = sequelize.define('SecaoRegistro', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    registro_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'registros',
        key: 'id'
      }
    },
    tag_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tags',
        key: 'id'
      }
    },
    valor_raw: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    parsed_value: {
      type: DataTypes.JSONB,
      allowNull: true, // Otimização para IA
      validate: {
        isValidJSON(value) {
          if (value !== null && typeof value !== 'object') {
            throw new Error('Parsed value deve ser um objeto JSON válido ou null');
          }
        }
      }
    },
    ordem: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      validate: {
        min: 0,
        max: 32767
      }
    }
  }, {
    tableName: 'secoes_registro',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['registro_id', 'ordem'],
        name: 'secoes_registro_ordem_unique'
      },
      {
        fields: ['registro_id']
      },
      {
        fields: ['tag_id']
      },
      {
        fields: ['parsed_value'],
        using: 'GIN',
        name: 'idx_secoes_parsed_gin'
      }
    ],
    validate: {
      // Validação para garantir ordem única por registro
      validarOrdem() {
        if (this.ordem < 0) {
          throw new Error('Ordem deve ser um número positivo');
        }
      }
    }
  });

  SecaoRegistro.associate = (models) => {
    // Relacionamento com registro
    SecaoRegistro.belongsTo(models.Registro, {
      foreignKey: 'registro_id',
      as: 'registro'
    });

    // Relacionamento com tag
    SecaoRegistro.belongsTo(models.TagDinamica, {
      foreignKey: 'tag_id',
      as: 'tag'
    });
  };

  // Métodos de classe
  SecaoRegistro.getSecoesForRegistro = async function(registroId) {
    return await this.findAll({
      where: {
        registro_id: registroId
      },
      include: [
        {
          model: sequelize.models.TagDinamica,
          as: 'tag',
          attributes: ['id', 'codigo', 'nome', 'tipo_dado', 'regras_validacao']
        }
      ],
      order: [['ordem', 'ASC']]
    });
  };

  SecaoRegistro.searchByParsedValue = async function(searchCriteria, medicoId) {
    const whereClause = {
      parsed_value: searchCriteria
    };

    return await this.findAll({
      where: whereClause,
      include: [
        {
          model: sequelize.models.Registro,
          as: 'registro',
          where: {
            medico_id: medicoId
          },
          include: [
            {
              model: sequelize.models.Paciente,
              as: 'paciente',
              attributes: ['id', 'nome']
            }
          ]
        },
        {
          model: sequelize.models.TagDinamica,
          as: 'tag',
          attributes: ['codigo', 'nome', 'tipo_dado']
        }
      ],
      order: [['registro', 'created_at', 'DESC']]
    });
  };

  // Buscar por tipo de dado específico
  SecaoRegistro.getByTipoDado = async function(tipoDado, medicoId, limit = 100) {
    return await this.findAll({
      include: [
        {
          model: sequelize.models.TagDinamica,
          as: 'tag',
          where: {
            tipo_dado: tipoDado
          },
          attributes: ['codigo', 'nome', 'tipo_dado']
        },
        {
          model: sequelize.models.Registro,
          as: 'registro',
          where: {
            medico_id: medicoId
          },
          attributes: ['id', 'created_at'],
          include: [
            {
              model: sequelize.models.Paciente,
              as: 'paciente',
              attributes: ['id', 'nome']
            }
          ]
        }
      ],
      order: [['registro', 'created_at', 'DESC']],
      limit
    });
  };

  // Estatísticas de uso de tags
  SecaoRegistro.getTagUsageStats = async function(medicoId, startDate, endDate) {
    const query = `
      SELECT 
        t.codigo,
        t.nome,
        t.tipo_dado,
        COUNT(*) as uso_count,
        COUNT(DISTINCT r.paciente_id) as pacientes_count
      FROM secoes_registro sr
      JOIN tags t ON sr.tag_id = t.id
      JOIN registros r ON sr.registro_id = r.id
      WHERE r.medico_id = :medicoId
        AND r.created_at BETWEEN :startDate AND :endDate
      GROUP BY t.id, t.codigo, t.nome, t.tipo_dado
      ORDER BY uso_count DESC
    `;

    return await sequelize.query(query, {
      replacements: {
        medicoId,
        startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 dias atrás
        endDate: endDate || new Date()
      },
      type: sequelize.QueryTypes.SELECT
    });
  };

  // Métodos de instância
  SecaoRegistro.prototype.updateParsedValue = async function(newParsedValue, transaction = null) {
    this.parsed_value = newParsedValue;
    return await this.save({ transaction });
  };

  SecaoRegistro.prototype.isNumericType = function() {
    return this.tag && ['numero', 'bp'].includes(this.tag.tipo_dado);
  };

  SecaoRegistro.prototype.isTextType = function() {
    return this.tag && this.tag.tipo_dado === 'texto';
  };

  SecaoRegistro.prototype.getDisplayValue = function() {
    if (this.parsed_value && typeof this.parsed_value === 'object') {
      // Para pressão arterial
      if (this.parsed_value.sistolica && this.parsed_value.diastolica) {
        return `${this.parsed_value.sistolica}/${this.parsed_value.diastolica} mmHg`;
      }
      // Para outros objetos JSON
      return JSON.stringify(this.parsed_value);
    }
    return this.valor_raw;
  };

  SecaoRegistro.prototype.validateValue = function() {
    if (!this.tag) {
      throw new Error('Tag não carregada para validação');
    }

    const rules = this.tag.regras_validacao || {};
    
    // Validar regex se especificada
    if (rules.regex) {
      const regex = new RegExp(rules.regex);
      if (!regex.test(this.valor_raw)) {
        throw new Error(`Valor não atende ao padrão: ${rules.regex}`);
      }
    }

    // Validações específicas por tipo
    switch (this.tag.tipo_dado) {
      case 'numero':
        if (isNaN(Number(this.valor_raw))) {
          throw new Error('Valor deve ser numérico');
        }
        break;
      case 'bp':
        if (!this.valor_raw.match(/^\d{2,3}\/\d{2,3}$/)) {
          throw new Error('Pressão arterial deve estar no formato XXX/YYY');
        }
        break;
      case 'data':
        if (isNaN(Date.parse(this.valor_raw))) {
          throw new Error('Valor deve ser uma data válida');
        }
        break;
    }

    return true;
  };

  return SecaoRegistro;
};