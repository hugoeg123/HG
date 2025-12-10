/**
 * Controlador de Notas de Conhecimento
 * 
 * Gerencia operações CRUD para notas da base de conhecimento
 * 
 * ## Integration Map
 * - **Connects To**: 
 *   - `models/sequelize/KnowledgeNote.js` for DB access
 *   - `models/sequelize/KnowledgeNoteRating.js` for ratings
 *   - `models/sequelize/KnowledgeNoteComment.js` for comments
 *   - `routes/knowledge.routes.js` (exported handlers)
 * - **Data Flow**: 
 *   - `getNotes`: Filters by term + (public OR (private AND owner)) + stats (ratings/comments)
 *   - `createNote`: Creates new note linked to current user
 *   - `updateNote`/`deleteNote`: Verifies ownership before modifying
 *   - `rateNote`: Adds/Updates rating
 *   - `addComment`: Adds comment
 *   - `getComments`: Lists comments for a note
 */

const { KnowledgeNote, User, Medico, KnowledgeNoteRating, KnowledgeNoteComment } = require('../models/sequelize');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database-pg');
const knowledgeService = require('../services/knowledge.service');

// Proxy para APIs externas
exports.getDrugs = async (req, res) => {
  try {
    const { query } = req.query;
    const results = await knowledgeService.searchDrugs(query);
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar medicamentos' });
  }
};

exports.getPapers = async (req, res) => {
  try {
    const { query } = req.query;
    const results = await knowledgeService.searchPapers(query);
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar artigos' });
  }
};

exports.getInteractions = async (req, res) => {
  try {
    const { query } = req.query;
    const results = await knowledgeService.searchInteractions(query);
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar interações' });
  }
};

exports.getDiagnostics = async (req, res) => {
  try {
    const { query } = req.query;
    const results = await knowledgeService.searchDiagnostics(query);
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar diagnósticos' });
  }
};

exports.getPubMed = async (req, res) => {
  try {
    const { query } = req.query;
    const results = await knowledgeService.searchPubMed(query);
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar no PubMed' });
  }
};

exports.getWikipedia = async (req, res) => {
  try {
    const { query } = req.query;
    const results = await knowledgeService.searchWikipedia(query);
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar na Wikipedia' });
  }
};

// Listar notas
exports.getNotes = async (req, res) => {
    try {
      const { term } = req.query;
    const userId = req.user.id;

    // Filtros
    const where = {};
    
    // Se tiver termo de busca, filtra por termo ou conteúdo
    if (term) {
      where[Op.or] = [
        { related_term: { [Op.iLike]: `%${term}%` } },
        { content: { [Op.iLike]: `%${term}%` } }
      ];
    }

    // Visibilidade: Públicas OU (Privadas E do usuário atual)
    where[Op.and] = [
      {
        [Op.or]: [
          { is_public: true },
          { user_id: userId }
        ]
      }
    ];

    const notes = await KnowledgeNote.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: 50,
      include: [
        {
          model: KnowledgeNoteRating,
          as: 'ratings',
          attributes: ['rating']
        },
        {
          model: KnowledgeNoteComment,
          as: 'comments',
          attributes: ['id']
        }
      ]
    });

    // Mapear para o formato esperado pelo frontend com estatísticas calculadas
    const results = notes.map(note => {
      const ratings = note.ratings || [];
      const comments = note.comments || [];
      
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

      return {
        id: note.id,
        text: note.content,
        author: note.author_name || 'Anônimo',
        isPublic: note.is_public,
        timestamp: note.created_at.getTime(),
        relatedTerm: note.related_term,
        isOwner: note.user_id === userId,
        // Social Stats
        community_votes: parseFloat(avgRating.toFixed(1)),
        votes_count: ratings.length,
        comments_count: comments.length
      };
    });

    res.json({ results });
  } catch (error) {
    console.error('Erro ao buscar notas:', error);
    res.status(500).json({ error: 'Erro ao buscar notas' });
  }
};

// Criar nota
exports.createNote = async (req, res) => {
  try {
    const { text, isPublic, relatedTerm } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role || 'medico';
    const authorName = req.user.name || req.body.author || 'Usuário';

    if (!text) {
      return res.status(400).json({ error: 'Texto da nota é obrigatório' });
    }

    const note = await KnowledgeNote.create({
      user_id: userId,
      user_type: userRole,
      content: text,
      is_public: isPublic || false,
      related_term: relatedTerm,
      author_name: authorName
    });

    res.status(201).json({
      id: note.id,
      text: note.content,
      author: note.author_name,
      isPublic: note.is_public,
      timestamp: note.created_at.getTime(),
      relatedTerm: note.related_term,
      isOwner: true,
      community_votes: 0,
      votes_count: 0,
      comments_count: 0
    });
  } catch (error) {
    console.error('Erro ao criar nota:', error);
    res.status(500).json({ error: 'Erro ao criar nota' });
  }
};

// Atualizar nota
exports.updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, isPublic } = req.body;
    const userId = req.user.id;

    const note = await KnowledgeNote.findByPk(id);

    if (!note) {
      return res.status(404).json({ error: 'Nota não encontrada' });
    }

    // Verificar permissão
    if (note.user_id !== userId) {
      return res.status(403).json({ error: 'Sem permissão para editar esta nota' });
    }

    if (text !== undefined) note.content = text;
    if (isPublic !== undefined) note.is_public = isPublic;

    await note.save();

    res.json({
      id: note.id,
      text: note.content,
      author: note.author_name,
      isPublic: note.is_public,
      timestamp: note.created_at.getTime(),
      relatedTerm: note.related_term,
      isOwner: true
    });
  } catch (error) {
    console.error('Erro ao atualizar nota:', error);
    res.status(500).json({ error: 'Erro ao atualizar nota' });
  }
};

// Excluir nota
exports.deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const note = await KnowledgeNote.findByPk(id);

    if (!note) {
      return res.status(404).json({ error: 'Nota não encontrada' });
    }

    // Verificar permissão
    if (note.user_id !== userId) {
      return res.status(403).json({ error: 'Sem permissão para excluir esta nota' });
    }

    await note.destroy();

    res.json({ message: 'Nota excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir nota:', error);
    res.status(500).json({ error: 'Erro ao excluir nota' });
  }
};

// Avaliar nota
exports.rateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Avaliação inválida (1-5)' });
    }

    const note = await KnowledgeNote.findByPk(id);
    if (!note) {
      return res.status(404).json({ error: 'Nota não encontrada' });
    }

    // Upsert rating
    const [userRating, created] = await KnowledgeNoteRating.findOrCreate({
      where: { note_id: id, user_id: userId },
      defaults: { rating }
    });

    if (!created) {
      userRating.rating = rating;
      await userRating.save();
    }

    // Recalcular média
    const ratings = await KnowledgeNoteRating.findAll({ where: { note_id: id } });
    const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

    res.json({ 
      success: true, 
      rating: userRating.rating,
      average: parseFloat(avgRating.toFixed(1)),
      count: ratings.length
    });
  } catch (error) {
    console.error('Erro ao avaliar nota:', error);
    res.status(500).json({ error: 'Erro ao avaliar nota' });
  }
};

// Adicionar comentário
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
      return res.status(400).json({ error: 'Conteúdo do comentário é obrigatório' });
    }

    const note = await KnowledgeNote.findByPk(id);
    if (!note) {
      return res.status(404).json({ error: 'Nota não encontrada' });
    }

    const comment = await KnowledgeNoteComment.create({
      note_id: id,
      user_id: userId,
      content
    });

    res.status(201).json({
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at,
      author_name: req.user.name || 'Usuário'
    });
  } catch (error) {
    console.error('Erro ao comentar nota:', error);
    res.status(500).json({ error: 'Erro ao comentar nota' });
  }
};

// Listar comentários
exports.getComments = async (req, res) => {
  try {
    const { id } = req.params;

    const comments = await KnowledgeNoteComment.findAll({
      where: { note_id: id },
      include: [
        {
          model: Medico,
          as: 'user',
          attributes: ['nome', 'especialidade']
        }
      ],
      order: [['created_at', 'ASC']]
    });

    const results = comments.map(c => ({
      id: c.id,
      content: c.content,
      created_at: c.created_at,
      author_name: c.user ? c.user.nome : 'Desconhecido',
      author_specialty: c.user ? c.user.especialidade : null
    }));

    res.json({ results });
  } catch (error) {
    console.error('Erro ao buscar comentários:', error);
    res.status(500).json({ error: 'Erro ao buscar comentários' });
  }
};
