/**
 * Modelo Sequelize para Registros
 * 
 * MISSÃO ZERO-DÉBITO: Registros de prontuário com auditoria
 * e preparação para IA/cálculos
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Registro = sequelize.define('Registro', {
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
    paciente_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'pacientes',
        key: 'id'
      }
    },
    created_at: {
      type: 'TIMESTAMPTZ',
      defaultValue: DataTypes.NOW,
      allowNull: false
    },
    conteudo_raw: {
      type: DataTypes.TEXT,
      allowNull: true // Para auditoria
    }
  }, {
    tableName: 'registros',
    timestamps: false, // Usando created_at customizado
    indexes: [
      {
        fields: ['medico_id']
      },
      {
        fields: ['paciente_id']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['medico_id', 'paciente_id', 'created_at']
      }
    ]
  });

  Registro.associate = (models) => {
    // Relacionamento com médico
    Registro.belongsTo(models.Medico, {
      foreignKey: 'medico_id',
      as: 'medico'
    });

    // Relacionamento com paciente
    Registro.belongsTo(models.Paciente, {
      foreignKey: 'paciente_id',
      as: 'paciente'
    });

    // Relacionamento com seções
    Registro.hasMany(models.SecaoRegistro, {
      foreignKey: 'registro_id',
      as: 'secoes'
    });
  };

  // Métodos de classe
  Registro.getRegistrosForMedico = async function(medicoId, limit = 50, offset = 0) {
    return await this.findAndCountAll({
      where: {
        medico_id: medicoId
      },
      include: [
        {
          model: sequelize.models.Paciente,
          as: 'paciente',
          attributes: ['id', 'nome']
        },
        {
          model: sequelize.models.SecaoRegistro,
          as: 'secoes',
          include: [
            {
              model: sequelize.models.TagDinamica,
              as: 'tag',
              attributes: ['codigo', 'nome', 'tipo_dado']
            }
          ],
          order: [['ordem', 'ASC']]
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
  };

  Registro.getRegistrosForPaciente = async function(pacienteId, medicoId, limit = 20) {
    return await this.findAll({
      where: {
        paciente_id: pacienteId,
        medico_id: medicoId
      },
      include: [
        {
          model: sequelize.models.SecaoRegistro,
          as: 'secoes',
          include: [
            {
              model: sequelize.models.TagDinamica,
              as: 'tag',
              attributes: ['codigo', 'nome', 'tipo_dado']
            }
          ],
          order: [['ordem', 'ASC']]
        }
      ],
      order: [['created_at', 'DESC']],
      limit
    });
  };

  // Método para criar registro com seções em transação
  Registro.createWithSections = async function(data, transaction = null) {
    const { medico_id, paciente_id, conteudo_raw, secoes } = data;
    
    const executeInTransaction = async (t) => {
      // Criar o registro
      const registro = await this.create({
        medico_id,
        paciente_id,
        conteudo_raw
      }, { transaction: t });

      // Criar as seções
      if (secoes && secoes.length > 0) {
        const secoesData = secoes.map(secao => ({
          ...secao,
          registro_id: registro.id
        }));

        await sequelize.models.SecaoRegistro.bulkCreate(secoesData, {
          transaction: t
        });
      }

      return registro;
    };

    if (transaction) {
      return await executeInTransaction(transaction);
    } else {
      return await sequelize.transaction(executeInTransaction);
    }
  };

  // Métodos de instância
  Registro.prototype.getStructuredData = async function() {
    const secoes = await this.getSecoes({
      include: [
        {
          model: sequelize.models.TagDinamica,
          as: 'tag',
          attributes: ['codigo', 'nome', 'tipo_dado']
        }
      ],
      order: [['ordem', 'ASC']]
    });

    const estruturado = {};
    secoes.forEach(secao => {
      if (secao.tag) {
        estruturado[secao.tag.codigo] = {
          valor_raw: secao.valor_raw,
          parsed_value: secao.parsed_value,
          tipo_dado: secao.tag.tipo_dado,
          nome_tag: secao.tag.nome
        };
      }
    });

    return estruturado;
  };

  Registro.prototype.calculateStats = async function() {
    const secoes = await this.getSecoes({
      include: [
        {
          model: sequelize.models.TagDinamica,
          as: 'tag'
        }
      ]
    });

    const stats = {
      total_secoes: secoes.length,
      tipos_dados: {},
      tem_sinais_vitais: false,
      completude: 0
    };

    secoes.forEach(secao => {
      if (secao.tag) {
        const tipo = secao.tag.tipo_dado;
        stats.tipos_dados[tipo] = (stats.tipos_dados[tipo] || 0) + 1;
        
        // Verificar sinais vitais
        if (secao.tag.codigo === '#PA' && secao.parsed_value) {
          stats.tem_sinais_vitais = true;
          stats.pressao_arterial = secao.parsed_value;
        }
      }
    });

    // Calcular completude (tags básicas)
    const tagsBasicas = ['#QP', '#HDA', '#EF'];
    const tagsPresentes = secoes.filter(s => 
      s.tag && tagsBasicas.includes(s.tag.codigo)
    ).length;
    
    stats.completude = Math.round((tagsPresentes / tagsBasicas.length) * 100);

    return stats;
  };

  return Registro;
};