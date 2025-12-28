import api, { rawApi } from './api';

const aiService = {
    // Context Management
    getContext: async () => {
        const response = await api.get('/ai/context');
        return response.data;
    },

    addContext: async (item) => {
        const response = await api.post('/ai/context', item);
        return response.data;
    },

    removeContext: async (id) => {
        const response = await api.delete(`/ai/context/${id}`);
        return response.data;
    },

    // Clear all context
    clearContext: async () => {
        const response = await api.delete('/ai/context');
        return response.data;
    },

    // Get Models
    getModels: async () => {
        const response = await api.get('/ai/models');
        return response.data;
    },

    getHealth: async () => {
        const baseURL =
            rawApi?.defaults?.baseURL ||
            import.meta.env.VITE_API_URL ||
            'http://localhost:5001/api';

        const response = await fetch(`${baseURL}/ai/health`, { method: 'GET' });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            const message = data?.message || 'Ollama indisponível';
            throw new Error(message);
        }
        return data;
    },

    // Chat with Stream Support
    chatStream: async ({ message, model, contexts, signal, onChunk, timeoutMs = 120000 }) => {
        const token = localStorage.getItem('hg_token') ||
            (JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token);

        const baseURL =
            rawApi?.defaults?.baseURL ||
            import.meta.env.VITE_API_URL ||
            'http://localhost:5001/api';

        // Create an internal controller to handle our timeout
        const controller = new AbortController();

        // If parent signal aborts, we should abort our internal controller too
        const onParentAbort = () => controller.abort();
        if (signal) {
            if (signal.aborted) {
                // Already aborted
                return;
            }
            signal.addEventListener('abort', onParentAbort, { once: true });
        }

        // Setup connection/idle timeout
        const timeoutId = setTimeout(() => {
            console.warn(`aiService: Request timed out after ${timeoutMs}ms`);
            controller.abort();
        }, timeoutMs);

        try {
            const headers = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const response = await fetch(`${baseURL}/ai/chat`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ message, model, contexts }),
                signal: controller.signal
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || response.statusText);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                // Process buffer for NDJSON
                const lines = buffer.split('\n');
                // Keep the last line in buffer if it's incomplete
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const json = JSON.parse(line);
                            // Ollama format: { message: { content: "..." }, done: false }
                            // Mock format (if we didn't change it): { content: "..." }

                            let content = '';
                            if (json.message && json.message.content) {
                                content = json.message.content;
                            } else if (json.content) {
                                content = json.content;
                            }

                            if (content) {
                                onChunk(content);
                            }
                        } catch (e) {
                            console.error('Error parsing JSON chunk:', e);
                        }
                    }
                }
            }

            // Process remaining buffer
            if (buffer.trim()) {
                try {
                    const json = JSON.parse(buffer);
                    let content = '';
                    if (json.message && json.message.content) {
                        content = json.message.content;
                    } else if (json.content) {
                        content = json.content;
                    }
                    if (content) onChunk(content);
                } catch (e) {
                    // Ignore incomplete JSON at end
                }
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                // Differentiate between user cancel (signal) and timeout (controller)
                if (signal?.aborted) {
                    // User cancelled, rethrow or ignore
                    throw error;
                } else {
                    // Internal timeout
                    throw new Error('Tempo limite excedido ao aguardar resposta do modelo.');
                }
            } else {
                throw error;
            }
        } finally {
            clearTimeout(timeoutId);
            if (signal) signal.removeEventListener('abort', onParentAbort);
        }
    },

    // Legacy Chat (keeping for compatibility if needed, though chatStream covers it)
    chat: async (message, model = 'gpt-4', signal) => {
        const response = await api.post('/ai/chat', { message, model }, { signal });
        return response.data;
    }
};

export default aiService;
