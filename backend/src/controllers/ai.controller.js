/**
 * AI Controller
 * 
 * Handles requests for AI context management and chat.
 */

const aiService = require('../services/ai.service');

const aiController = {
    // Get current context for the authenticated user
    getContext: async (req, res) => {
        try {
            const userId = req.user.id;
            const context = await aiService.getContext(userId);
            res.json(context);
        } catch (error) {
            console.error('Error getting context:', error);
            res.status(500).json({ message: 'Error retrieving context' });
        }
    },

    // Add item to context
    addContext: async (req, res) => {
        try {
            const userId = req.user.id;
            const { type, content, metadata, id } = req.body;

            if (!content) {
                return res.status(400).json({ message: 'Content is required' });
            }

            const context = await aiService.addContext(userId, { type, content, metadata, id });
            res.json(context);
        } catch (error) {
            console.error('Error adding context:', error);
            res.status(500).json({ message: 'Error adding to context' });
        }
    },

    // Remove item from context
    removeContext: async (req, res) => {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            const context = await aiService.removeContext(userId, id);
            res.json(context);
        } catch (error) {
            console.error('Error removing context:', error);
            res.status(500).json({ message: 'Error removing from context' });
        }
    },

    // Clear all context
    clearContext: async (req, res) => {
        try {
            const userId = req.user.id;
            const context = await aiService.clearContext(userId);
            res.json(context);
        } catch (error) {
            console.error('Error clearing context:', error);
            res.status(500).json({ message: 'Error clearing context' });
        }
    },

    // Chat with AI
    chat: async (req, res) => {
        try {
            const userId = req.user.id;
            const { message, model } = req.body;

            if (!message) {
                return res.status(400).json({ message: 'Message is required' });
            }

            const response = await aiService.chat(userId, message, model);
            res.json(response);
        } catch (error) {
            console.error('Error in chat:', error);
            res.status(500).json({ message: 'Error processing chat request' });
        }
    }
};

module.exports = aiController;
