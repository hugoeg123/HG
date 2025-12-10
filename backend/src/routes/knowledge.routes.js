const express = require('express');
const router = express.Router();
const knowledgeController = require('../controllers/knowledge.controller');
const authMiddleware = require('../middleware/auth').authMiddleware; 

/**
 * Knowledge Routes
 * 
 * ## Integration Map
 * - **Mounted at**: `/api/knowledge` in `backend/src/routes/index.js`
 * - **Connects To**: 
 *   - `controllers/knowledge.controller.js`
 *   - `middleware/auth.js` for protection
 */

// Use auth middleware for all routes
router.use(authMiddleware);

// External API Proxy Routes
router.get('/drugs', knowledgeController.getDrugs);
router.get('/papers', knowledgeController.getPapers);
router.get('/interactions', knowledgeController.getInteractions);
router.get('/icd', knowledgeController.getDiagnostics);
router.get('/pubmed', knowledgeController.getPubMed);
router.get('/wikipedia', knowledgeController.getWikipedia);

// Internal Notes Routes
router.get('/notes', knowledgeController.getNotes);
router.post('/notes', knowledgeController.createNote);
router.put('/notes/:id', knowledgeController.updateNote);
router.delete('/notes/:id', knowledgeController.deleteNote);

// Social routes
router.post('/notes/:id/rate', knowledgeController.rateNote);
router.post('/notes/:id/comments', knowledgeController.addComment);
router.get('/notes/:id/comments', knowledgeController.getComments);

module.exports = router;
