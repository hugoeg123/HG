/**
 * AI Service
 * 
 * Manages AI context and interactions with LLMs.
 * Currently stores context in-memory.
 */

class ContextManager {
    constructor() {
        // Storage: { userId: [ { id, type, content, metadata } ] }
        this.contexts = new Map();
    }

    getContext(userId) {
        return this.contexts.get(userId) || [];
    }

    addContext(userId, item) {
        const currentContext = this.getContext(userId);
        // Avoid duplicates based on ID if provided
        if (item.id) {
            const exists = currentContext.some(c => c.id === item.id);
            if (exists) return currentContext;
        }

        const newItem = {
            ...item,
            id: item.id || `ctx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date()
        };

        const newContext = [...currentContext, newItem];
        this.contexts.set(userId, newContext);
        return newContext;
    }

    removeContext(userId, itemId) {
        const currentContext = this.getContext(userId);
        const newContext = currentContext.filter(c => c.id !== itemId);
        this.contexts.set(userId, newContext);
        return newContext;
    }

    clearContext(userId) {
        this.contexts.delete(userId);
        return [];
    }
}

class LLMService {
    constructor() {
        this.contextManager = new ContextManager();
    }

    // Delegate context methods
    getContext(userId) { return this.contextManager.getContext(userId); }
    addContext(userId, item) { return this.contextManager.addContext(userId, item); }
    removeContext(userId, itemId) { return this.contextManager.removeContext(userId, itemId); }
    clearContext(userId) { return this.contextManager.clearContext(userId); }

    async chat(userId, message, model = 'gpt-4') {
        const context = this.getContext(userId);

        // Construct the prompt with context
        const systemPrompt = `You are a helpful medical AI assistant.
    
Context Information:
${context.map(c => `[${c.type.toUpperCase()}] ${c.content}`).join('\n\n')}

User Question: ${message}`;

        // Mock response for now (since we don't have real API keys configured yet)
        // In a real implementation, this would call OpenAI/Anthropic/Google API
        console.log(`[LLM Service] Calling model ${model} for user ${userId}`);
        console.log(`[LLM Service] Prompt length: ${systemPrompt.length}`);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        return {
            role: 'assistant',
            content: `[Simulated Response from ${model}]\n\nBased on the context provided (${context.length} items), here is my analysis:\n\n${message}\n\n(This is a functional backend mock. To use real AI, configure API keys in .env)`,
            model: model,
            timestamp: new Date()
        };
    }
}

module.exports = new LLMService();
