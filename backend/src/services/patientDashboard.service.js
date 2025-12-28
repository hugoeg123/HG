/**
 * Serviço do Dashboard do Paciente
 * 
 * Consolida dados de registros médicos para exibição no dashboard
 * 
 * Conector: Integra com models/Record.js e shared/parser.js
 * Hook: Usado por controllers/patient.controller.js no endpoint /dashboard
 */

const { Record, Tag, Medico } = require('../models');
const { parseSections, calculateStats } = require('../../../shared/parser');
const { Op } = require('sequelize');

const DEFAULT_DASHBOARD_TAGS = [
  { id: '00000000-0000-0000-0000-000000000001', medico_id: null, parent_id: null, codigo: '#DX', nome: 'Diagnóstico', tipo_dado: 'texto', regras_validacao: {} },
  { id: '00000000-0000-0000-0000-000000000002', medico_id: null, parent_id: null, codigo: '#PROBLEMA', nome: 'Problema', tipo_dado: 'texto', regras_validacao: {} },
  { id: '00000000-0000-0000-0000-000000000003', medico_id: null, parent_id: null, codigo: '#ALERGIA', nome: 'Alergia', tipo_dado: 'texto', regras_validacao: {} },
  { id: '00000000-0000-0000-0000-000000000004', medico_id: null, parent_id: null, codigo: '#ALERGIAS', nome: 'Alergias', tipo_dado: 'texto', regras_validacao: {} },
  { id: '00000000-0000-0000-0000-000000000005', medico_id: null, parent_id: null, codigo: '#MEDICAMENTO', nome: 'Medicamento', tipo_dado: 'texto', regras_validacao: {} },
  { id: '00000000-0000-0000-0000-000000000006', medico_id: null, parent_id: null, codigo: '#MEDICAMENTOS', nome: 'Medicamentos', tipo_dado: 'texto', regras_validacao: {} },
  { id: '00000000-0000-0000-0000-000000000007', medico_id: null, parent_id: null, codigo: '#PLANO', nome: 'Plano', tipo_dado: 'texto', regras_validacao: {} },
  { id: '00000000-0000-0000-0000-000000000008', medico_id: null, parent_id: null, codigo: '#EXAME', nome: 'Exame', tipo_dado: 'texto', regras_validacao: {} },
  { id: '00000000-0000-0000-0000-000000000009', medico_id: null, parent_id: null, codigo: '#LABORATORIO', nome: 'Laboratório', tipo_dado: 'texto', regras_validacao: {} },
  { id: '00000000-0000-0000-0000-00000000000a', medico_id: null, parent_id: null, codigo: '#RESULTADO', nome: 'Resultado', tipo_dado: 'texto', regras_validacao: {} },
  { id: '00000000-0000-0000-0000-00000000000b', medico_id: null, parent_id: null, codigo: '#INVESTIGACAO', nome: 'Investigação', tipo_dado: 'texto', regras_validacao: {} },
  { id: '00000000-0000-0000-0000-00000000000c', medico_id: null, parent_id: null, codigo: '#PENDENTE', nome: 'Pendente', tipo_dado: 'texto', regras_validacao: {} },
  { id: '00000000-0000-0000-0000-00000000000d', medico_id: null, parent_id: null, codigo: '#QP', nome: 'Queixa Principal', tipo_dado: 'texto', regras_validacao: {} },
  { id: '00000000-0000-0000-0000-00000000000e', medico_id: null, parent_id: null, codigo: '#HDA', nome: 'História da Doença Atual', tipo_dado: 'texto', regras_validacao: {} },
  { id: '00000000-0000-0000-0000-00000000000f', medico_id: null, parent_id: null, codigo: '#EF', nome: 'Exame Físico', tipo_dado: 'texto', regras_validacao: {} },
  { id: '00000000-0000-0000-0000-000000000010', medico_id: null, parent_id: null, codigo: '#PA', nome: 'Pressão Arterial', tipo_dado: 'bp', regras_validacao: {} },
  { id: '00000000-0000-0000-0000-000000000011', medico_id: null, parent_id: null, codigo: '#TEMP', nome: 'Temperatura', tipo_dado: 'numero', regras_validacao: {} },
  { id: '00000000-0000-0000-0000-000000000012', medico_id: null, parent_id: null, codigo: '#TEMPERATURA', nome: 'Temperatura', tipo_dado: 'numero', regras_validacao: {} },
  { id: '00000000-0000-0000-0000-000000000013', medico_id: null, parent_id: null, codigo: '#FC', nome: 'Frequência Cardíaca', tipo_dado: 'numero', regras_validacao: {} },
  { id: '00000000-0000-0000-0000-000000000014', medico_id: null, parent_id: null, codigo: '#FREQ_CARDIACA', nome: 'Frequência Cardíaca', tipo_dado: 'numero', regras_validacao: {} },
  { id: '00000000-0000-0000-0000-000000000015', medico_id: null, parent_id: null, codigo: '#PULSO', nome: 'Pulso', tipo_dado: 'numero', regras_validacao: {} },
  { id: '00000000-0000-0000-0000-000000000016', medico_id: null, parent_id: null, codigo: '#SPO2', nome: 'Saturação', tipo_dado: 'numero', regras_validacao: {} },
  { id: '00000000-0000-0000-0000-000000000017', medico_id: null, parent_id: null, codigo: '#SAT', nome: 'Saturação', tipo_dado: 'numero', regras_validacao: {} },
  { id: '00000000-0000-0000-0000-000000000018', medico_id: null, parent_id: null, codigo: '#SATURACAO', nome: 'Saturação', tipo_dado: 'numero', regras_validacao: {} },
  { id: '00000000-0000-0000-0000-000000000019', medico_id: null, parent_id: null, codigo: '#O2', nome: 'Oxigênio', tipo_dado: 'numero', regras_validacao: {} }
];

/**
 * Busca e consolida dados do dashboard para um paciente
 * @param {string} patientId - UUID do paciente
 * @returns {Promise<Object>} Dados consolidados do dashboard
 * 
 * IA prompt: Expandir para incluir análise de tendências e alertas automáticos
 * Performance Analysis: Adicionado profiling detalhado para identificar gargalos
 */
async function getPatientDashboardData(patientId) {
  console.time('🔍 Dashboard Total Time');
  console.time('📊 Database Queries');
  
  try {
    // Buscar todos os registros do paciente (não deletados) com médico criador
    console.time('📋 Records Query');
    const records = await Record.findAll({
      where: {
        patientId,
        isDeleted: false
      },
      include: [{
        model: Medico,
        as: 'medicoCriador',
        attributes: ['id', 'nome', 'professional_id']
      }],
      order: [['date', 'DESC']],
      limit: 20 // Limitar para performance otimizada
    });
    console.timeEnd('📋 Records Query');
    console.log(`📊 Records encontrados: ${records.length}`);

    // Buscar todas as tags disponíveis para parsing
    console.time('🏷️ Tags Query');
    let tags = [];
    try {
      tags = await Tag.findAll({
        attributes: ['id', 'medico_id', 'parent_id', 'codigo', 'nome', 'tipo_dado', 'regras_validacao', 'createdAt', 'updatedAt']
      });
    } catch (error) {
      tags = [];
    }
    if (!Array.isArray(tags) || tags.length === 0) {
      tags = [...DEFAULT_DASHBOARD_TAGS];
    }
    const existingCodigos = new Set(tags.map(t => t?.codigo).filter(Boolean));
    for (const defaultTag of DEFAULT_DASHBOARD_TAGS) {
      if (!existingCodigos.has(defaultTag.codigo)) {
        tags.push(defaultTag);
      }
    }
    const tagMap = new Map(tags.map(t => [t.id, t]));
    console.timeEnd('🏷️ Tags Query');
    console.log(`🏷️ Tags carregadas: ${tags.length}`);
    console.timeEnd('📊 Database Queries');

    // Inicializar estrutura do dashboard
    console.time('🏗️ Data Processing');
    const dashboardData = {
      problemasAtivos: [],
      alergias: [],
      medicamentosEmUso: [],
      investigacoesEmAndamento: [],
      resultadosRecentes: [],
      historicoConsultas: [],
      sinaisVitais: {
        pressao: { valor: '--', status: 'neutral', timestamp: '--' },
        temperatura: { valor: '--', status: 'neutral', timestamp: '--' },
        saturacao: { valor: '--', status: 'neutral', timestamp: '--' },
        frequencia: { valor: '--', status: 'neutral', timestamp: '--' }
      }
    };

    // Processar cada registro
    let processedRecords = 0;
    let errorCount = 0;
    
    for (const record of records) {
      try {
        console.time(`📝 Parse Record ${record.id}`);
        // Parsear o conteúdo do registro usando o parser compartilhado
        const sections = parseSections(record.content, tags);
        console.timeEnd(`📝 Parse Record ${record.id}`);
        
        console.time(`🔍 Extract Info ${record.id}`);
        // Extrair informações relevantes baseadas nas tags
        await extractDashboardInfo(sections, tagMap, record, dashboardData);
        console.timeEnd(`🔍 Extract Info ${record.id}`);
        
        processedRecords++;
      } catch (parseError) {
        errorCount++;
        console.error(`❌ Erro ao processar registro ${record.id}:`, parseError.message);
        // Continuar processamento mesmo com erro de parsing
      }
    }
    
    console.log(`✅ Registros processados: ${processedRecords}, Erros: ${errorCount}`);

    // Ordenar e limitar resultados
    console.time('📊 Data Consolidation');
    dashboardData.problemasAtivos = dashboardData.problemasAtivos.slice(0, 10);
    dashboardData.alergias = dashboardData.alergias.slice(0, 10);
    dashboardData.medicamentosEmUso = dashboardData.medicamentosEmUso.slice(0, 15);
    dashboardData.investigacoesEmAndamento = dashboardData.investigacoesEmAndamento.slice(0, 10);
    dashboardData.resultadosRecentes = dashboardData.resultadosRecentes.slice(0, 20);
    dashboardData.historicoConsultas = dashboardData.historicoConsultas.slice(0, 10);
    console.timeEnd('📊 Data Consolidation');
    console.timeEnd('🏗️ Data Processing');
    
    
    
    console.timeEnd('🔍 Dashboard Total Time');
    return dashboardData;

  } catch (error) {
    console.timeEnd('🔍 Dashboard Total Time');
    console.error('❌ Erro ao buscar dados do dashboard:', error);
    throw new Error('Falha ao consolidar dados do dashboard');
  }
}

/**
 * Extrai informações específicas do dashboard a partir das seções parseadas
 * @param {Array} sections - Seções parseadas do registro
 * @param {Map} tagMap - Map de tags disponíveis (id -> tag)
 * @param {Object} record - Registro original
 * @param {Object} dashboardData - Objeto para acumular dados do dashboard
 * 
 * Conector: Utiliza tags estruturadas para categorizar informações médicas
 */
async function extractDashboardInfo(sections, tagMap, record, dashboardData) {
  for (const section of sections) {
    const tag = tagMap.get(section.tag_id);
    if (!tag) continue;

    // Formatar informações do médico criador
    // 🔁 Padrão: doctorName = só o nome; CRM separado.
    const medicoCriador = record.medicoCriador?.nome || 'Médico não identificado';

    const info = {
      data: record.date,
      fonte: record.title,
      registroId: record.id,
      valor: section.valor_raw,
      valorParseado: section.parsed_value,
      doctorName: medicoCriador,
      doctorCRM: record.medicoCriador?.professional_id || null
    };

    // Categorizar baseado no código da tag
    switch (tag.codigo) {
      case '#DX': // Diagnósticos
      case '#PROBLEMA':
        dashboardData.problemasAtivos.push({
          ...info,
          problema: section.valor_raw,
          status: 'ativo' // Assumir ativo por padrão
        });
        break;

      case '#ALERGIA':
      case '#ALERGIAS':
        dashboardData.alergias.push({
          ...info,
          alergia: section.valor_raw,
          tipo: 'medicamento' // Assumir medicamento por padrão
        });
        break;

      case '#MEDICAMENTO':
      case '#MEDICAMENTOS':
      case '#PLANO': // Plano pode conter medicamentos
        // Extrair medicamentos do texto
        const medicamentos = extractMedicamentos(section.valor_raw);
        medicamentos.forEach(med => {
          dashboardData.medicamentosEmUso.push({
            ...info,
            medicamento: med,
            status: 'em_uso'
          });
        });
        break;

      case '#EXAME':
      case '#LABORATORIO':
      case '#RESULTADO':
        dashboardData.resultadosRecentes.push({
          ...info,
          exame: section.valor_raw,
          tipo: 'laboratorio'
        });
        break;

      case '#INVESTIGACAO':
      case '#PENDENTE':
        dashboardData.investigacoesEmAndamento.push({
          ...info,
          investigacao: section.valor_raw,
          status: 'pendente'
        });
        break;

      case '#QP': // Queixa Principal
      case '#HDA': // História da Doença Atual
      case '#EF': // Exame Físico
        dashboardData.historicoConsultas.push({
          ...info,
          tipo: getConsultaType(tag.codigo),
          resumo: section.valor_raw.substring(0, 200) + (section.valor_raw.length > 200 ? '...' : '')
        });
        break;

      case '#PA': // Pressão Arterial
        if (section.parsed_value && section.parsed_value.sistolica) {
          const valor = `${section.parsed_value.sistolica}/${section.parsed_value.diastolica}`;
          updateVitalSign(dashboardData, 'pressao', valor, record.date);
          
          dashboardData.resultadosRecentes.push({
            ...info,
            exame: 'Pressão Arterial',
            resultado: `${valor} mmHg`,
            tipo: 'sinal_vital'
          });
        }
        break;

      case '#TEMP':
      case '#TEMPERATURA':
        updateVitalSign(dashboardData, 'temperatura', section.valor_raw + '°C', record.date);
        break;

      case '#FC':
      case '#FREQ_CARDIACA':
      case '#PULSO':
        updateVitalSign(dashboardData, 'frequencia', section.valor_raw + ' bpm', record.date);
        break;

      case '#SPO2':
      case '#SAT':
      case '#SATURACAO':
      case '#O2':
        updateVitalSign(dashboardData, 'saturacao', section.valor_raw + '%', record.date);
        break;

      default:
        // Para outras tags, adicionar ao histórico de consultas
        if (section.valor_raw.length > 10) { // Apenas se tiver conteúdo significativo
          dashboardData.historicoConsultas.push({
            ...info,
            tipo: 'outros',
            resumo: section.valor_raw.substring(0, 200) + (section.valor_raw.length > 200 ? '...' : '')
          });
        }
        break;
    }
  }
}

/**
 * Extrai nomes de medicamentos de um texto
 * @param {string} texto - Texto contendo medicamentos
 * @returns {Array<string>} Lista de medicamentos encontrados
 * 
 * IA prompt: Implementar NLP para melhor extração de medicamentos
 */
function extractMedicamentos(texto) {
  // Implementação simples - pode ser melhorada com NLP
  const medicamentos = [];
  
  // Padrões comuns de medicamentos
  const patterns = [
    /\b\w+\s*\d+\s*mg\b/gi, // Ex: Paracetamol 500mg
    /\b\w+\s*\d+\s*mcg\b/gi, // Ex: Levotiroxina 50mcg
    /\b\w+\s*\d+\s*g\b/gi, // Ex: Amoxicilina 1g
  ];

  patterns.forEach(pattern => {
    const matches = texto.match(pattern);
    if (matches) {
      medicamentos.push(...matches);
    }
  });

  // Se não encontrou padrões específicos, dividir por vírgulas/quebras de linha
  if (medicamentos.length === 0) {
    const linhas = texto.split(/[,\n;]/);
    linhas.forEach(linha => {
      const limpa = linha.trim();
      if (limpa.length > 3 && limpa.length < 100) {
        medicamentos.push(limpa);
      }
    });
  }

  return [...new Set(medicamentos)]; // Remover duplicatas
}

/**
 * Mapeia código de tag para tipo de consulta
 * @param {string} codigo - Código da tag
 * @returns {string} Tipo de consulta
 */
function getConsultaType(codigo) {
  const mapping = {
    '#QP': 'queixa_principal',
    '#HDA': 'historia_doenca',
    '#EF': 'exame_fisico',
    '#PLANO': 'plano_terapeutico'
  };
  return mapping[codigo] || 'outros';
}

/**
 * Atualiza um sinal vital no dashboard se ainda não tiver valor
 * @param {Object} dashboardData - Dados do dashboard
 * @param {string} key - Chave do sinal vital (pressao, temperatura, saturacao, frequencia)
 * @param {string} value - Valor formatado
 * @param {Date|string} timestamp - Data do registro
 */
function updateVitalSign(dashboardData, key, value, timestamp) {
  if (dashboardData.sinaisVitais && dashboardData.sinaisVitais[key] && dashboardData.sinaisVitais[key].valor === '--') {
    dashboardData.sinaisVitais[key] = {
      valor: value,
      status: 'success', // Pode implementar lógica de alerta aqui depois
      timestamp: timestamp ? new Date(timestamp).toLocaleDateString('pt-BR') : 'Hoje'
    };
  }
}

/**
 * Busca registros recentes de um paciente para análise de tendências
 * @param {string} patientId - UUID do paciente
 * @param {number} days - Número de dias para buscar (padrão: 30)
 * @returns {Promise<Array>} Registros recentes
 * 
 * Hook: Pode ser usado para análise de tendências e alertas
 */
async function getRecentRecords(patientId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await Record.findAll({
    where: {
      patientId,
      isDeleted: false,
      date: {
        [Op.gte]: startDate
      }
    },
    order: [['date', 'DESC']]
  });
}

module.exports = {
  getPatientDashboardData,
  extractDashboardInfo,
  extractMedicamentos,
  getConsultaType,
  getRecentRecords
};
