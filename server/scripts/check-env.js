#!/usr/bin/env node

/**
 * Environment Configuration Checker
 * Run this script to verify your .env file is properly configured
 * Usage: node server/scripts/check-env.js
 */

import dotenv from "dotenv";
import chalk from "chalk";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().regex(/^\d+$/, "PORT must be a number").default("3005"),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL"),
  GITHUB_CLIENT_ID: z.string().min(1, "GITHUB_CLIENT_ID is required"),
  GITHUB_CLIENT_SECRET: z.string().min(1, "GITHUB_CLIENT_SECRET is required"),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  ORBITAI_MODEL: z.string().default("gemini-2.5-flash"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

console.log(chalk.cyan.bold("\n🔍 Checking Environment Configuration...\n"));

try {
  const env = envSchema.parse(process.env);
  
  console.log(chalk.green("✅ All required environment variables are valid!\n"));
  
  console.log(chalk.gray("Configuration:"));
  console.log(chalk.gray(`  PORT: ${env.PORT}`));
  console.log(chalk.gray(`  DATABASE_URL: ${env.DATABASE_URL.substring(0, 30)}...`));
  console.log(chalk.gray(`  BETTER_AUTH_URL: ${env.BETTER_AUTH_URL}`));
  console.log(chalk.gray(`  GITHUB_CLIENT_ID: ${env.GITHUB_CLIENT_ID.substring(0, 10)}...`));
  console.log(chalk.gray(`  ORBITAI_MODEL: ${env.ORBITAI_MODEL}`));
  console.log(chalk.gray(`  NODE_ENV: ${env.NODE_ENV}`));
  
  if (env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.log(chalk.gray(`  GOOGLE_GENERATIVE_AI_API_KEY: Set ✓`));
  } else {
    console.log(chalk.yellow(`  GOOGLE_GENERATIVE_AI_API_KEY: Not set (users can set via 'orbit config set')`));
  }
  
  console.log(chalk.green("\n✨ Your environment is ready to go!\n"));
  process.exit(0);
  
} catch (error) {
  console.log(chalk.red.bold("❌ Environment validation failed:\n"));
  
  if (error instanceof z.ZodError) {
    error.errors.forEach((err) => {
      console.log(chalk.red(`  • ${err.path.join(".")}: ${err.message}`));
    });
    
    console.log(chalk.yellow("\n💡 How to fix:"));
    console.log(chalk.gray("  1. Make sure you have a .env file in the server directory"));
    console.log(chalk.gray("  2. Copy .env.example to .env if you haven't already"));
    console.log(chalk.gray("  3. Fill in all required values"));
    console.log(chalk.gray("  4. See ENV_VALIDATION.md for detailed setup instructions\n"));
  }
  
  process.exit(1);
}
