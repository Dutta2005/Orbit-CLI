import chalk from "chalk";
import { trackApiCall } from "../../lib/analytics.js";
import { AIFactory } from "../../services/ai/ai.factory.js";

export class AIService {
    constructor(userConfig = null, userId = null) {
        this.provider = AIFactory.createProvider(userConfig);
        this.userId = userId;
    }

    async sendMessage(messages, onChunk, tools = undefined, onToolCall = null) {
        const executeCall = async () => {
            try {
                return await this.provider.sendMessage(messages, onChunk, tools, onToolCall);
            } catch (error) {
                if (!this.userId) {
                    if (error.statusCode === 401 || error.statusCode === 403 || error.message.includes("API_KEY") || error.message.includes("key")) {
                        console.error(chalk.red("\n❌ Authentication Error: Invalid or missing API Key."));
                        console.error(chalk.yellow("Please check your configuration using 'orbit config set'.\n"));
                    } else {
                        console.error(chalk.red("\n❌ AI Service Error:"), error.message);
                    }
                }
                throw error;
            }
        };

        if (this.userId) {
            return await trackApiCall(this.userId, this.provider.getProviderName(), this.provider.modelName, executeCall);
        } else {
            return await executeCall();
        }
    }

    async getMessage(messages, tools = undefined) {
        const executeCall = async () => {
            try {
                return await this.provider.getMessage(messages, tools);
            } catch (error) {
                throw error;
            }
        };

        if (this.userId) {
            return await this.provider.getMessage(messages, tools);
        } else {
            return await this.provider.getMessage(messages, tools);
        }
    }

    async generateStructured(schema, prompt) {
        const executeCall = async () => {
            try {
                return await this.provider.generateStructured(schema, prompt);
            } catch (error) {
                if (error.statusCode === 401 || error.statusCode === 403 || error.message.includes("API_KEY") || error.message.includes("key")) {
                    console.error(chalk.red("\n❌ Authentication Error: Invalid or missing API Key."));
                    console.error(chalk.yellow("Please check your configuration using 'orbit config set'.\n"));
                } else {
                    console.error(chalk.red("\n❌ AI Structured Generation Error:"), error.message);
                }
                throw error;
            }
        };

        if (this.userId) {
            return await trackApiCall(this.userId, this.provider.getProviderName(), this.provider.modelName, executeCall);
        } else {
            return await executeCall();
        }
    }
}
