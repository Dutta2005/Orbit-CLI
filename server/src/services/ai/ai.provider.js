export class AIProvider {
    /**
     * Send a streaming message
     * @param {Array} messages - Chat messages
     * @param {Function} onChunk - Callback for text chunks
     * @param {Object} [tools] - Tools for the AI
     * @param {Function} [onToolCall] - Callback for tool calls
     * @returns {Promise<Object>} The full response object
     */
    async sendMessage(messages, onChunk, tools, onToolCall) {
        throw new Error("Method 'sendMessage(messages, onChunk, tools, onToolCall)' must be implemented.");
    }

    /**
     * Get a full text response
     * @param {Array} messages - Chat messages
     * @param {Object} [tools] - Tools for the AI
     * @returns {Promise<string>} The response text
     */
    async getMessage(messages, tools) {
        throw new Error("Method 'getMessage(messages, tools)' must be implemented.");
    }

    /**
     * Generate a structured JSON object
     * @param {Object} schema - Zod schema for validation
     * @param {string} prompt - Prompt to generate object from
     * @returns {Promise<Object>} The structured object
     */
    async generateStructured(schema, prompt) {
        throw new Error("Method 'generateStructured(schema, prompt)' must be implemented.");
    }

    /**
     * Provide the identifier for tracking purposes
     * @returns {string} e.g. "google", "openai", "anthropic"
     */
    getProviderName() {
        throw new Error("Method 'getProviderName()' must be implemented.");
    }
}
