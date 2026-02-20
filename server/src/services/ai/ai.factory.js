import { GoogleProvider } from "./providers/google.provider.js";
import { OpenAIProvider } from "./providers/openai.provider.js";
import { AnthropicProvider } from "./providers/anthropic.provider.js";

export class AIFactory {
    /**
     * Creates an AI provider instance based on user configuration
     * @param {Object} userConfig - The user's AI config from the database
     * @returns {import('./ai.provider.js').AIProvider}
     */
    static createProvider(userConfig = null) {
        const providerName = userConfig?.provider || "google";
        const apiKey = userConfig?.apiKey;
        const modelName = userConfig?.model;

        switch (providerName.toLowerCase()) {
            case "openai":
                return new OpenAIProvider(apiKey, modelName);
            case "anthropic":
                return new AnthropicProvider(apiKey, modelName);
            case "google":
            default:
                return new GoogleProvider(apiKey, modelName);
        }
    }
}
