import prisma from "../lib/db.js";

export class AnalyticsService {
  async logCommand(userId, command, status, duration = null, errorMessage = null, metadata = null) {
    return await prisma.commandLog.create({
      data: {
        userId,
        command,
        status,
        duration,
        errorMessage,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  }

  async logApiCall(userId, provider, model, status, duration = null, tokensUsed = null, errorMessage = null) {
    return await prisma.apiCallLog.create({
      data: {
        userId,
        provider,
        model,
        status,
        duration,
        tokensUsed,
        errorMessage,
      },
    });
  }

  async getCommandStats(userId = null, startDate = null, endDate = null) {
    const where = {
      ...(userId && { userId }),
    };

    // Support partial date range filters
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const commands = await prisma.commandLog.groupBy({
      by: ["command", "status"],
      where,
      _count: true,
    });

    return commands;
  }

  async getApiCallStats(userId = null, startDate = null, endDate = null) {
    const where = {
      ...(userId && { userId }),
    };

    // Support partial date range filters
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const calls = await prisma.apiCallLog.groupBy({
      by: ["provider", "model", "status"],
      where,
      _count: true,
      _avg: {
        duration: true,
        tokensUsed: true,
      },
    });

    return calls;
  }

  async getCommandTimeline(userId = null, startDate = null, endDate = null) {
    const where = {
      ...(userId && { userId }),
    };

    // Support partial date range filters
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    return await prisma.commandLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async getApiCallTimeline(userId = null, startDate = null, endDate = null) {
    const where = {
      ...(userId && { userId }),
    };

    // Support partial date range filters
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    return await prisma.apiCallLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }
}
