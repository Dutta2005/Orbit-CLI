#!/usr/bin/env node

/**
 * Simple test runner for environment validation
 * Run with: node server/tests/env.config.simple.test.js
 */

import { validateEnv } from "../src/config/env.config.js";

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

function expect(value) {
  return {
    toThrow: () => {
      try {
        value();
        return false;
      } catch {
        return true;
      }
    },
    not: {
      toThrow: () => {
        try {
          value();
          return true;
        } catch {
          return false;
        }
      },
    },
  };
}

// Test cases
test("should pass with all required variables", () => {
  const originalEnv = { ...process.env };
  process.env = {
    PORT: "3005",
    DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
    BETTER_AUTH_SECRET: "a".repeat(32),
    BETTER_AUTH_URL: "http://localhost:3005",
    GITHUB_CLIENT_ID: "test_client_id",
    GITHUB_CLIENT_SECRET: "test_client_secret",
    NODE_ENV: "development",
  };

  const result = expect(() => validateEnv()).not.toThrow();
  process.env = originalEnv;
  return result;
});

test("should fail when DATABASE_URL is missing", () => {
  const originalEnv = { ...process.env };
  process.env = {
    PORT: "3005",
    BETTER_AUTH_SECRET: "a".repeat(32),
    BETTER_AUTH_URL: "http://localhost:3005",
    GITHUB_CLIENT_ID: "test_client_id",
    GITHUB_CLIENT_SECRET: "test_client_secret",
  };

  const result = expect(() => validateEnv()).toThrow();
  process.env = originalEnv;
  return result;
});

test("should fail when DATABASE_URL is invalid", () => {
  const originalEnv = { ...process.env };
  process.env = {
    PORT: "3005",
    DATABASE_URL: "not-a-url",
    BETTER_AUTH_SECRET: "a".repeat(32),
    BETTER_AUTH_URL: "http://localhost:3005",
    GITHUB_CLIENT_ID: "test_client_id",
    GITHUB_CLIENT_SECRET: "test_client_secret",
  };

  const result = expect(() => validateEnv()).toThrow();
  process.env = originalEnv;
  return result;
});

test("should fail when BETTER_AUTH_SECRET is too short", () => {
  const originalEnv = { ...process.env };
  process.env = {
    PORT: "3005",
    DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
    BETTER_AUTH_SECRET: "short",
    BETTER_AUTH_URL: "http://localhost:3005",
    GITHUB_CLIENT_ID: "test_client_id",
    GITHUB_CLIENT_SECRET: "test_client_secret",
  };

  const result = expect(() => validateEnv()).toThrow();
  process.env = originalEnv;
  return result;
});

// Run tests
console.log("\n🧪 Running Environment Validation Tests\n");

for (const { name, fn } of tests) {
  try {
    const result = fn();
    if (result) {
      console.log(`✅ ${name}`);
      passed++;
    } else {
      console.log(`❌ ${name}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
}

console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
