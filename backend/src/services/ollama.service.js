const axios = require('axios');

class OllamaService {
    constructor() {
        this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        this.keepAlive = process.env.OLLAMA_KEEP_ALIVE || '10m';
    }

    async health(timeoutMs = 2000) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/version`, { timeout: timeoutMs });
            return { ok: true, baseUrl: this.baseUrl, version: response.data?.version };
        } catch (error) {
            return { ok: false, baseUrl: this.baseUrl, message: error.message };
        }
    }

    async getTags() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/tags`);
            return response.data.models || [];
        } catch (error) {
            console.error('Error fetching Ollama tags:', error.message);
            // Return empty array instead of throwing to allow UI to handle it gracefully
            return [];
        }
    }

    async chatStream(model, messages, res, signal, options = {}) {
        const firstTokenTimeoutMs = Number(options.firstTokenTimeoutMs ?? process.env.OLLAMA_FIRST_TOKEN_TIMEOUT_MS ?? 45000);
        const overallTimeoutMs = Number(options.overallTimeoutMs ?? process.env.OLLAMA_OVERALL_TIMEOUT_MS ?? 180000);
        const keepAlive = options.keepAlive ?? this.keepAlive;

        const controller = new AbortController();
        const onParentAbort = () => controller.abort();
        let overallTimeout = null;

        try {
            if (signal) signal.addEventListener('abort', onParentAbort, { once: true });

            overallTimeout = setTimeout(() => controller.abort(), overallTimeoutMs);

            const response = await axios.post(`${this.baseUrl}/api/chat`, {
                model,
                messages,
                stream: true,
                keep_alive: keepAlive
            }, {
                responseType: 'stream',
                signal: controller.signal
            });

            if (!res.headersSent) {
                res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
                res.setHeader('Cache-Control', 'no-cache, no-transform');
                res.setHeader('Connection', 'keep-alive');
                res.setHeader('X-Accel-Buffering', 'no');
                if (typeof res.flushHeaders === 'function') res.flushHeaders();
            }

            // Pipe the data directly to the express response
            response.data.pipe(res);
            
            await new Promise((resolve, reject) => {
                let firstTokenTimer = setTimeout(() => controller.abort(), firstTokenTimeoutMs);
                let receivedFirstToken = false;

                const cleanup = () => {
                    if (overallTimeout) clearTimeout(overallTimeout);
                    clearTimeout(firstTokenTimer);
                    if (signal) signal.removeEventListener('abort', onParentAbort);
                };

                response.data.on('data', () => {
                    if (!receivedFirstToken) {
                        receivedFirstToken = true;
                        clearTimeout(firstTokenTimer);
                        firstTokenTimer = null;
                    }
                });

                response.data.on('end', () => {
                    cleanup();
                    resolve();
                });
                response.data.on('error', (err) => {
                    cleanup();
                    console.error('Stream error:', err);
                    reject(err);
                });
            });
            return;

        } catch (error) {
            if (axios.isCancel(error)) {
                console.log('Ollama request cancelled');
                // Don't send error to client if cancelled by client
            } else {
                console.error('Error in Ollama chat:', error.message);
                // If headers haven't been sent yet, send error JSON
                if (!res.headersSent) {
                    res.status(503).json({ message: 'Failed to connect to Ollama service' });
                }
            }
        } finally {
            if (overallTimeout) clearTimeout(overallTimeout);
            if (signal) signal.removeEventListener('abort', onParentAbort);
        }
    }
}

module.exports = new OllamaService();
