import express from "express";
import { auth } from "./lib/auth.js";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import cors from "cors";
import { validateEnv } from "./config/env.config.js";
import { AnalyticsService } from "./services/analytics.services.js";

const env = validateEnv();
const app = express();
const port = parseInt(env.PORT);
const analyticsService = new AnalyticsService();

app.use(
  cors({
    origin: "http://localhost:3000", 
    methods: ["GET", "POST", "PUT", "DELETE"], 
    credentials: true, 
  })
);

app.all("/api/auth/*splat", toNodeHandler(auth)); 

app.use(express.json());

app.get("/api/me", async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    
    if (!session) {
      return res.status(401).json({ error: "No active session" });
    }
    
    return res.json(session);
  } catch (error) {
    console.error("Session error:", error);
    return res.status(500).json({ error: "Failed to get session", details: error.message });
  }
});

app.get("/api/me/:access_token", async (req, res) => {
  const { access_token } = req.params;
  console.log(access_token);
  
  try {
    const session = await auth.api.getSession({
      headers: {
        authorization: `Bearer ${access_token}`
      }
    });
    
    if (!session) {
      return res.status(401).json({ error: "Invalid token" });
    }
    
    return res.json(session);
  } catch (error) {
    console.error("Token validation error:", error);
    return res.status(401).json({ error: "Unauthorized", details: error.message });
  }
});

app.get("/device", async (req, res) => {
  const { user_code } = req.query; 
  res.redirect(`http://localhost:3000/device?user_code=${user_code}`);
});

// Authentication middleware for analytics endpoints
const requireAuth = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    
    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }
    
    req.user = session.user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ error: "Authentication failed", details: error.message });
  }
};

// Analytics endpoints
app.get("/api/analytics/commands", requireAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await analyticsService.getCommandStats(req.user.id, startDate, endDate);
    return res.json(stats);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/analytics/api-calls", requireAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await analyticsService.getApiCallStats(req.user.id, startDate, endDate);
    return res.json(stats);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/analytics/command-timeline", requireAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const timeline = await analyticsService.getCommandTimeline(req.user.id, startDate, endDate);
    return res.json(timeline);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/analytics/api-timeline", requireAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const timeline = await analyticsService.getApiCallTimeline(req.user.id, startDate, endDate);
    return res.json(timeline);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
