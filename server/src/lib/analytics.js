import { AnalyticsService } from "../services/analytics.services.js";

const analyticsService = new AnalyticsService();

export async function trackCommand(userId, command, fn) {
  const startTime = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    // Fire-and-forget: don't await analytics logging
    analyticsService.logCommand(userId, command, "success", duration)
      .catch(err => console.error("Analytics logging error:", err.message));
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    // Fire-and-forget: don't await analytics logging
    analyticsService.logCommand(userId, command, "failure", duration, error.message)
      .catch(err => console.error("Analytics logging error:", err.message));
    throw error;
  }
}

export async function trackApiCall(userId, provider, model, fn) {
  const startTime = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    // Fire-and-forget: don't await analytics logging
    analyticsService.logApiCall(userId, provider, model, "success", duration)
      .catch(err => console.error("Analytics logging error:", err.message));
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    // Fire-and-forget: don't await analytics logging
    analyticsService.logApiCall(userId, provider, model, "failure", duration, null, error.message)
      .catch(err => console.error("Analytics logging error:", err.message));
    throw error;
  }
}
