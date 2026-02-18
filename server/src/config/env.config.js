import { z } from "zod";
import chalk from "chalk";

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

export function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error(chalk.red.bold("\n❌ Environment validation failed:\n"));
    
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(chalk.red(`  • ${err.path.join(".")}: ${err.message}`));
      });
      
      console.error(chalk.yellow("\n💡 Fix:"));
      console.error(chalk.gray("  1. Copy .env.example to .env"));
      console.error(chalk.gray("  2. Fill in all required values"));
      console.error(chalk.gray("  3. See README.md for setup guides\n"));
    }
    
    process.exit(1);
  }
}
