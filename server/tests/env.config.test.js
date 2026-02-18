import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { validateEnv } from "../src/config/env.config.js";

describe("Environment Validation", () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should pass with all required variables", () => {
    process.env = {
      PORT: "3005",
      DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
      BETTER_AUTH_SECRET: "a".repeat(32),
      BETTER_AUTH_URL: "http://localhost:3005",
      GITHUB_CLIENT_ID: "test_client_id",
      GITHUB_CLIENT_SECRET: "test_client_secret",
      NODE_ENV: "development",
    };

    expect(() => validateEnv()).not.toThrow();
  });

  it("should fail when DATABASE_URL is missing", () => {
    process.env = {
      PORT: "3005",
      BETTER_AUTH_SECRET: "a".repeat(32),
      BETTER_AUTH_URL: "http://localhost:3005",
      GITHUB_CLIENT_ID: "test_client_id",
      GITHUB_CLIENT_SECRET: "test_client_secret",
    };

    expect(() => validateEnv()).toThrow();
  });

  it("should fail when DATABASE_URL is invalid", () => {
    process.env = {
      PORT: "3005",
      DATABASE_URL: "not-a-url",
      BETTER_AUTH_SECRET: "a".repeat(32),
      BETTER_AUTH_URL: "http://localhost:3005",
      GITHUB_CLIENT_ID: "test_client_id",
      GITHUB_CLIENT_SECRET: "test_client_secret",
    };

    expect(() => validateEnv()).toThrow();
  });

  it("should fail when BETTER_AUTH_SECRET is too short", () => {
    process.env = {
      PORT: "3005",
      DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
      BETTER_AUTH_SECRET: "short",
      BETTER_AUTH_URL: "http://localhost:3005",
      GITHUB_CLIENT_ID: "test_client_id",
      GITHUB_CLIENT_SECRET: "test_client_secret",
    };

    expect(() => validateEnv()).toThrow();
  });

  it("should use default values for optional fields", () => {
    process.env = {
      DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
      BETTER_AUTH_SECRET: "a".repeat(32),
      BETTER_AUTH_URL: "http://localhost:3005",
      GITHUB_CLIENT_ID: "test_client_id",
      GITHUB_CLIENT_SECRET: "test_client_secret",
    };

    const env = validateEnv();
    expect(env.PORT).toBe("3005");
    expect(env.ORBITAI_MODEL).toBe("gemini-2.5-flash");
    expect(env.NODE_ENV).toBe("development");
  });
});
