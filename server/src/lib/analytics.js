import { AnalyticsService } from "../services/analytics.services.js";

const analyticsService = new AnalyticsService();

export async function trackCommand(userId, command, fn) {
  const startTime = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    await analyticsService.logCommand(userId, command, "success", duration);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    await analyticsService.logCommand(userId, command, "failure", duration, error.message);
    throw error;
  }
}

export async function trackApiCall(userId, provider, model, fn) {
  const startTime = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    await analyticsService.logApiCall(userId, provider, model, "success", duration);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    await analyticsService.logApiCall(userId, provider, model, "failure", duration, null, error.message);
    throw error;
  }
}
