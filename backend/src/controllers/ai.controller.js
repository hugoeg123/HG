/**
 * AI Controller
 * 
 * Handles requests for AI context management and chat.
 */

const aiService = require('../services/ai.service');
const ollamaService = require('../services/ollama.service');
const contextSerializer = require('../services/ai/context.serializer');

const aiController = {
    // Get available models
    getModels: async (req, res) => {
        try {
            // Cloud models (mocked/static for now)
            const cloudModels = [
                { id: 'gpt-4', name: 'GPT-4 (OpenAI)', provider: 'openai' },
                { id: 'claude-3-opus', name: 'Claude 3 Opus (Anthropic)', provider: 'anthropic' },
                { id: 'gemini-pro', name: 'Gemini Pro (Google)', provider: 'google' }
            ];

            // Local models from Ollama
            let localModels = [];
            try {
                const tags = await ollamaService.getTags();
                localModels = tags.map(m => ({
                    id: m.name,
                    name: `${m.name} (Local)`,
                    provider: 'ollama'
                }));
            } catch (err) {
                console.warn('Could not fetch local models:', err.message);
                // Don't fail completely if local models are unavailable
            }

            res.json([...localModels, ...cloudModels]);
        } catch (error) {
            console.error('Error getting models:', error);
            res.status(500).json({ message: 'Error retrieving models' });
        }
    },

    health: async (_req, res) => {
        try {
            const status = await ollamaService.health();
            if (status.ok) return res.json(status);
            return res.status(503).json(status);
        } catch (error) {
            console.error('Error checking Ollama health:', error);
            return res.status(503).json({ ok: false, message: 'Failed to check Ollama health' });
        }
    },

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
            const { message, model, contexts } = req.body;

            if (!message) {
                return res.status(400).json({ message: 'Message is required' });
            }

            // If it's a local model (or we decide to treat all through ollama for this plan)
            // For now, let's assume if it's NOT one of the cloud IDs, it's local
            const cloudIds = ['gpt-4', 'claude-3-opus', 'gemini-pro'];
            const isLocal = !cloudIds.includes(model);

            if (isLocal) {
                // 1. Serialize Contexts
                let systemContext = "You are a helpful medical AI assistant. Act as a Medical Documentation Copilot.";
                
                // Add active contexts from request
                if (contexts && contexts.length > 0) {
                    const serializedContexts = contexts.map(c => contextSerializer.serialize(c.type, c.content)).join('\n\n');
                    systemContext += `\n\nCONTEXTO MÉDICO:\n${serializedContexts}`;
                }

                // Add stored context (from aiService/ContextManager)
                // Note: The new plan seems to favor passing activeContexts from frontend, 
                // but we can still fetch stored ones if needed. 
                // For this implementation, we rely on 'contexts' passed in body as per plan.

                // 2. Prepare Messages for Ollama
                const messages = [
                    { role: 'system', content: systemContext },
                    { role: 'user', content: message }
                ];

                // Create an abort signal if client disconnects
                const abortController = new AbortController();
                req.on('close', () => {
                    abortController.abort();
                });

                await ollamaService.chatStream(model, messages, res, abortController.signal);
            } else {
                // Fallback to existing mocked service for cloud models
                // Note: Existing service doesn't support streaming in the same way yet, 
                // so we return JSON as before, but frontend expects stream now?
                // We should adapt frontend to handle both or simulate stream here.
                // For simplicity, let's return JSON and let frontend handle it (or wrap in stream).
                // Actually, let's make the frontend smart enough to handle JSON response too,
                // OR we simulate stream for consistency.
                
                const response = await aiService.chat(userId, message, model);
                res.json(response);
            }
        } catch (error) {
            console.error('Error in chat:', error);
            if (!res.headersSent) {
                res.status(500).json({ message: 'Error processing chat request' });
            }
        }
    }
};

module.exports = aiController;
