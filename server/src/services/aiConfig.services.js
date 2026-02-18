import prisma from "../lib/db.js";
import { google } from "@ai-sdk/google";

export class AiConfigService {
  async getConfig(userId) {
    return await prisma.aiConfig.findUnique({
      where: { userId },
    });
  }

  async setConfig(userId, apiKey, model) {
    return await prisma.aiConfig.upsert({
      where: { userId },
      update: { apiKey, model, updatedAt: new Date() },
      create: { userId, apiKey, model, provider: "google" },
    });
  }

  async deleteConfig(userId) {
    return await prisma.aiConfig.delete({
      where: { userId },
    });
  }

  async validateApiKey(apiKey, model) {
    try {
      const testModel = google(model, { apiKey });
      const { generateText } = await import("ai");
      await generateText({
        model: testModel,
        prompt: "test",
        maxTokens: 5,
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
