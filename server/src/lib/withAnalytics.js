import { trackCommand } from "../../../lib/analytics.js";
import { getStoredToken } from "../commands/auth/login.js";
import prisma from "../lib/db.js";

export async function withAnalytics(command, action) {
  return async (...args) => {
    const startTime = Date.now();
    let userId = null;
    
    try {
      // Try to get user ID from token
      const token = await getStoredToken();
      if (token?.access_token) {
        const user = await prisma.user.findFirst({
          where: {
            sessions: {
              some: { token: token.access_token },
            },
          },
        });
        userId = user?.id;
      }
    } catch (error) {
      // Ignore errors getting user ID
    }

    if (userId) {
      return await trackCommand(userId, command, () => action(...args));
    } else {
      // Execute without tracking if no user
      return await action(...args);
    }
  };
}
