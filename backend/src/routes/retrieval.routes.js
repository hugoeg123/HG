const express = require('express');
const router = express.Router();
const retrievalController = require('../controllers/RetrievalController');
const { authenticate } = require('../middleware/auth.middleware');

/* 
  Retrieval Routes
  Phase 2: RAG & Retrieval Engine
*/

// Debug endpoint for RAG visualization
// Protected by Auth Middleware to prevent unauthorized access
router.post('/debug', authenticate, retrievalController.debug);

// Inspect all indexed documents for a patient
router.get('/inspect/:patientId', authenticate, retrievalController.inspect);

// Manually re-index a patient (Force Sync)
router.post('/reindex/:patientId', authenticate, retrievalController.reindex);

// Helper to manually index a sample (Dev only)
// Protected by Auth Middleware
router.post('/index-sample', authenticate, retrievalController.indexSample);

module.exports = router;
