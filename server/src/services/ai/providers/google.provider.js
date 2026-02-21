import { google } from "@ai-sdk/google";
import { streamText, generateObject } from "ai";
import { config } from "../../../config/google.config.js";
import chalk from "chalk";
import { AIProvider } from "../ai.provider.js";

export class GoogleProvider extends AIProvider {
    constructor(apiKey, modelName) {
        super();
        this.apiKey = apiKey || config.googleApiKey;
        this.modelName = modelName || config.model;

        if (!this.apiKey) {
            throw new Error("GOOGLE_API_KEY is not set");
        }

        // Explicit setup for Gemini
        this.model = google(this.modelName, { apiKey: this.apiKey });
    }

    getProviderName() {
        return "google";
    }

    async sendMessage(messages, onChunk, tools = undefined, onToolCall = null) {
        try {
            const streamConfig = {
                model: this.model,
                messages: messages,
                // using optional config properties if present, otherwise leaving defaults to model
                temperature: config.temperature,
                maxTokens: config.maxTokens,
            };

            if (tools && Object.keys(tools).length > 0) {
                streamConfig.tools = tools;
                streamConfig.maxSteps = 5;
                console.log(chalk.gray(`[DEBUG] Google tools enabled: ${Object.keys(tools).join(', ')}`));
            }

            const result = streamText(streamConfig);

            let fullResponse = "";
            for await (const chunk of result.textStream) {
                fullResponse += chunk;
                if (onChunk) {
                    onChunk(chunk);
                }
            }

            const fullResult = await result;

            const toolCalls = [];
            const toolResults = [];

            if (fullResult.steps && Array.isArray(fullResult.steps)) {
                for (const step of fullResult.steps) {
                    if (step.toolCalls && step.toolCalls.length > 0) {
                        for (const toolCall of step.toolCalls) {
                            toolCalls.push(toolCall);
                            if (onToolCall) {
                                onToolCall(toolCall);
                            }
                        }
                    }
                    if (step.toolResults && step.toolResults.length > 0) {
                        toolResults.push(...step.toolResults);
                    }
                }
            }

            return {
                content: fullResponse,
                finishReason: fullResult.finishReason,
                usage: fullResult.usage,
                toolCalls,
                toolResults,
                steps: fullResult.steps,
            };
        } catch (error) {
            throw error;
        }
    }

    async getMessage(messages, tools = undefined) {
        let fullResponse = "";
        const result = await this.sendMessage(messages, (chunk) => {
            fullResponse += chunk;
        }, tools);
        return result.content;
    }

    async generateStructured(schema, prompt) {
        try {
            const result = await generateObject({
                model: this.model,
                schema: schema,
                prompt: prompt,
            });
            return result.object;
        } catch (error) {
            throw error;
        }
    }
}
