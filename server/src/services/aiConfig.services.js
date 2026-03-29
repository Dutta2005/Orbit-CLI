import prisma from "../lib/db.js";
import { AIFactory } from "./ai/ai.factory.js";
import { decryptSecret, encryptSecret, isEncryptedSecret } from "../lib/encryption.js";

export class AiConfigService {
  async getConfig(userId, provider = null) {
    const config = provider
      ? await prisma.aiConfig.findUnique({
          where: { userId_provider: { userId, provider } },
        })
      : await prisma.aiConfig.findFirst({
          where: { userId },
          orderBy: { updatedAt: "desc" },
        });

    if (!config) {
      return null;
    }

    const decryptedApiKey = decryptSecret(config.apiKey);

    // Opportunistically migrate old plaintext API keys to encrypted storage.
    if (config.apiKey && !isEncryptedSecret(config.apiKey)) {
      const encrypted = encryptSecret(config.apiKey);
      if (encrypted !== config.apiKey) {
        await prisma.aiConfig.update({
          where: { id: config.id },
          data: { apiKey: encrypted, updatedAt: new Date() },
        });
      }
    }

    return {
      ...config,
      apiKey: decryptedApiKey,
    };
  }

  async getConfigs(userId) {
    const configs = await prisma.aiConfig.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    return await Promise.all(
      configs.map(async (config) => {
        const decryptedApiKey = decryptSecret(config.apiKey);

        if (config.apiKey && !isEncryptedSecret(config.apiKey)) {
          const encrypted = encryptSecret(config.apiKey);
          if (encrypted !== config.apiKey) {
            await prisma.aiConfig.update({
              where: { id: config.id },
              data: { apiKey: encrypted, updatedAt: new Date() },
            });
          }
        }

        return {
          ...config,
          apiKey: decryptedApiKey,
        };
      })
    );
  }

  async setConfig(userId, apiKey, model, provider = "google") {
    const encryptedApiKey = encryptSecret(apiKey);

    return await prisma.aiConfig.upsert({
      where: { userId_provider: { userId, provider } },
      update: { apiKey: encryptedApiKey, model, provider, updatedAt: new Date() },
      create: { userId, apiKey: encryptedApiKey, model, provider },
    });
  }

  async deleteConfig(userId, provider = null) {
    if (provider) {
      return await prisma.aiConfig.delete({
        where: { userId_provider: { userId, provider } },
      });
    }

    return await prisma.aiConfig.deleteMany({
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
