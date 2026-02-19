import { google } from "@ai-sdk/google";
import { streamText, generateObject } from "ai";
import { config } from "../../config/google.config.js";
import chalk from "chalk";
import { trackApiCall } from "../../lib/analytics.js";

export class AIService {
  constructor(userConfig = null, userId = null) {
    const apiKey = userConfig?.apiKey || config.googleApiKey;
    const modelName = userConfig?.model || config.model;

    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY is not set");
    }
    
    this.model = google(modelName, { apiKey });
    this.userId = userId;
    this.modelName = modelName;
  }

  async sendMessage(messages, onChunk, tools = undefined, onToolCall = null) {
    const executeCall = async () => {
      try {
        const streamConfig = {
          model: this.model,
          messages: messages,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
        };

        if (tools && Object.keys(tools).length > 0) {
          streamConfig.tools = tools;
          streamConfig.maxSteps = 5;
          
          console.log(chalk.gray(`[DEBUG] Tools enabled: ${Object.keys(tools).join(', ')}`));
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
        console.error(chalk.red("AI Service Error:"), error.message);
        console.error(chalk.red("Full error:"), error);
        throw error;
      }
    };

    if (this.userId) {
      return await trackApiCall(this.userId, "google", this.modelName, executeCall);
    } else {
      return await executeCall();
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
    const executeCall = async () => {
      try {
        const result = await generateObject({
          model: this.model,
          schema: schema,
          prompt: prompt,
        });
        
        return result.object;
      } catch (error) {
        console.error(chalk.red("AI Structured Generation Error:"), error.message);
        throw error;
      }
    };

    if (this.userId) {
      return await trackApiCall(this.userId, "google", this.modelName, executeCall);
    } else {
      return await executeCall();
    }
  }
}
