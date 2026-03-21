import chalk from "chalk";
import { Command } from "commander";
import yoctoSpinner from "yocto-spinner";
import { getStoredToken } from "../auth/login.js";
import { envSchema } from "../../../config/env.config.js";
import prisma from "../../../lib/db.js";
import { AiConfigService } from "../../../services/aiConfig.services.js";

const aiConfigService = new AiConfigService();

const checkEnvVars = () => {
  const result = envSchema.safeParse(process.env);
  if (result.success) {
    console.log(`  ${chalk.green('✔')} Environment variables: All required variables present`);
    return true;
  } else {
    console.log(`  ${chalk.red('❌')} Environment variables: Missing or invalid variables`);
    const issues = result.error.errors || result.error.issues || [];
    issues.forEach((err) => {
      console.log(`    ${chalk.red('•')} ${err.path.join(".")}: ${err.message}`);
    });
    return false;
  }
};

const checkDbConnection = async () => {
  try {
    // A simple query to test connection
    await prisma.$queryRaw`SELECT 1`;
    console.log(`  ${chalk.green('✔')} Database connection: Connected`);
    return true;
  } catch (error) {
    console.log(`  ${chalk.red('❌')} Database connection: Failed to connect`);
    console.log(`    ${chalk.gray('•')} ${error.message}`);
    console.log(`    ${chalk.yellow('💡 Fix:')} Ensure your DATABASE_URL is correct and the database server is running.`);
    return false;
  }
};

const checkBackend = async () => {
  const url = process.env.BETTER_AUTH_URL || `http://localhost:${process.env.PORT || 3005}`;
  try {
    // Simply fetch the root or a health endpoint to verify the server answers HTTP requests.
    await fetch(url).catch(err => {
      // If it throws TypeError for failed fetch, re-throw it to catch block below.
      // If it responds with 404, it's alive!
      if (err instanceof TypeError && err.cause) throw err;
    });
    console.log(`  ${chalk.green('✔')} Backend server: Reachable at ${url}`);
    return true;
  } catch (error) {
    console.log(`  ${chalk.red('❌')} Backend server: Unreachable at ${url}`);
    console.log(`    ${chalk.gray('•')} ${error.message}`);
    console.log(`    ${chalk.yellow('💡 Fix:')} Make sure your backend server is running.`);
    return false;
  }
};

const checkAuth = async () => {
  const token = await getStoredToken();
  if (!token) {
    console.log(`  ${chalk.yellow('⚠')} Authentication: Not logged in`);
    console.log(`    ${chalk.yellow('💡 Fix:')} Run 'orbit login' to authenticate.`);
    return { authenticated: false, userId: null };
  }

  const isExpired = token.expires_at && new Date(token.expires_at) < new Date();
  if (isExpired) {
    console.log(`  ${chalk.yellow('⚠')} Authentication: Session expired`);
    console.log(`    ${chalk.yellow('💡 Fix:')} Run 'orbit login' again.`);
    return { authenticated: false, userId: null };
  }

  try {
    const user = await prisma.user.findFirst({
      where: { sessions: { some: { token: token.access_token } } }
    });

    if (user) {
      console.log(`  ${chalk.green('✔')} Authentication: Logged in as ${user.email}`);
      return { authenticated: true, userId: user.id };
    } else {
       console.log(`  ${chalk.red('❌')} Authentication: Invalid token or user not found`);
       return { authenticated: false, userId: null };
    }
  } catch (err) {
     console.log(`  ${chalk.yellow('⚠')} Authentication: Could not verify (Database unreachable)`);
     return { authenticated: false, userId: null };
  }
};

const checkAiConfig = async (userId) => {
  try {
    let apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    let provider = "google";
    let model = process.env.ORBITAI_MODEL || "gemini-2.5-flash";

    if (userId) {
       const user = await prisma.user.findUnique({ where: { id: userId }, include: { aiConfig: true } });
       if (user?.aiConfig) {
         apiKey = user.aiConfig.apiKey;
         provider = user.aiConfig.provider;
         model = user.aiConfig.model;
       }
    }

    if (!apiKey) {
      console.log(`  ${chalk.yellow('⚠')} AI Configuration: Missing API Key`);
      console.log(`    ${chalk.yellow('💡 Fix:')} Run 'orbit config set' or set GOOGLE_GENERATIVE_AI_API_KEY in .env`);
      return false;
    }

    const spinner = yoctoSpinner({ text: "Validating AI configuration..." }).start();
    const isValid = await aiConfigService.validateApiKey(apiKey, model, provider);
    spinner.stop();

    if (isValid) {
      console.log(`  ${chalk.green('✔')} AI Configuration: Valid (${provider} - ${model})`);
      return true;
    } else {
      console.log(`  ${chalk.red('❌')} AI Configuration: Invalid API Key or model`);
      console.log(`    ${chalk.yellow('💡 Fix:')} Run 'orbit config set' to update your credentials.`);
      return false;
    }
  } catch (err) {
      console.log(`  ${chalk.yellow('⚠')} AI Configuration: Could not validate (${err.message})`);
      return false;
  }
};

const doctorAction = async () => {
   console.log(chalk.bold.cyan("\n🩺 Orbit CLI Diagnostics\n"));
   let hasErrors = false;

   const envOk = checkEnvVars();
   if (!envOk) hasErrors = true;

   const dbOk = await checkDbConnection();
   if (!dbOk) hasErrors = true;

   const backendOk = await checkBackend();
   if (!backendOk) hasErrors = true;

   const auth = await checkAuth();
   if (!auth.authenticated) hasErrors = true;

   const aiOk = await checkAiConfig(auth.userId);
   if (!aiOk) hasErrors = true;

   console.log("\n" + chalk.gray("─".repeat(40)));
   if (hasErrors) {
     console.log(chalk.red("\n❌ Diagnostics completed with issues. Please apply the fixes above.\n"));
   } else {
     console.log(chalk.green("\n✅ All systems operational! The CLI is fully configured.\n"));
   }
};

export const doctor = new Command("doctor")
  .description("Diagnose environment and setup issues")
  .addHelpText('after', `
${chalk.bold.cyan('What this does:')}
  Checks your local environment for missing variables, bad database connections,
  unreachable backend servers, unauthenticated states, and invalid AI keys.

${chalk.bold.cyan('Examples:')}
  ${chalk.gray('$')} orbit doctor
`)
  .action(doctorAction);
