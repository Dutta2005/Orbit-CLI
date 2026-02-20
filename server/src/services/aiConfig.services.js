import prisma from "../lib/db.js";
import { AIFactory } from "./ai/ai.factory.js";

export class AiConfigService {
  async getConfig(userId) {
    return await prisma.aiConfig.findUnique({
      where: { userId },
    });
  }

  async setConfig(userId, apiKey, model, provider = "google") {
    return await prisma.aiConfig.upsert({
      where: { userId },
      update: { apiKey, model, provider, updatedAt: new Date() },
      create: { userId, apiKey, model, provider },
    });
  }

  async deleteConfig(userId) {
    return await prisma.aiConfig.delete({
      where: { userId },
    });
  }

  async validateApiKey(apiKey, model, providerName = "google") {
    try {
      const provider = AIFactory.createProvider({ provider: providerName, apiKey, model });
      const { generateText } = await import("ai");
      await generateText({
        model: provider.model,
        prompt: "test",
        maxTokens: 5,
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
