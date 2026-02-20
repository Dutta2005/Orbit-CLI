import chalk from "chalk";
import { Command } from "commander";
import { text, select, confirm } from "@clack/prompts";
import yoctoSpinner from "yocto-spinner";
import boxen from "boxen";
import { getStoredToken } from "../auth/login.js";
import prisma from "../../../lib/db.js";
import { AiConfigService } from "../../../services/aiConfig.services.js";

const aiConfigService = new AiConfigService();

const GEMINI_MODELS = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Recommended)" },
  { value: "gemini-2.0-flash-exp", label: "Gemini 2.0 Flash Experimental" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
  { value: "gemini-1.5-pro-002", label: "Gemini 1.5 Pro 002" },
  { value: "gemini-1.5-flash-002", label: "Gemini 1.5 Flash 002" },
  { value: "gemini-1.5-flash-8b", label: "Gemini 1.5 Flash 8B" },
  { value: "gemini-exp-1206", label: "Gemini Experimental 1206" },
  { value: "gemini-2.0-flash-thinking-exp", label: "Gemini 2.0 Flash Thinking (Experimental)" },
];

const OPENAI_MODELS = [
  { value: "gpt-4o", label: "GPT-4o (Recommended)" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
];

const ANTHROPIC_MODELS = [
  { value: "claude-3-5-sonnet-latest", label: "Claude 3.5 Sonnet (Recommended)" },
  { value: "claude-3-5-haiku-latest", label: "Claude 3.5 Haiku" },
  { value: "claude-3-opus-latest", label: "Claude 3 Opus" },
];

async function getUserFromToken() {
  const token = await getStoredToken();

  if (!token?.access_token) {
    throw new Error("Not authenticated. Please run 'orbit login' first.");
  }

  const user = await prisma.user.findFirst({
    where: {
      sessions: {
        some: { token: token.access_token },
      },
    },
    include: {
      aiConfig: true,
    },
  });

  if (!user) {
    throw new Error("User not found. Please login again.");
  }

  return user;
}

const configSetAction = async () => {
  try {
    console.log(
      boxen(chalk.bold.cyan("⚙️  AI Configuration Setup"), {
        padding: 1,
        borderStyle: "double",
        borderColor: "cyan",
      })
    );

    const user = await getUserFromToken();
    let isValid = false;
    let providerName, apiKey, model;

    providerName = await select({
      message: chalk.blue("Configure your preferred AI provider"),
      options: [
        { value: "google", label: "Google Gemini", hint: "Recommended" },
        { value: "openai", label: "OpenAI GPT" },
        { value: "anthropic", label: "Anthropic Claude" }
      ],
      initialValue: "google"
    });

    const providerNames = {
      google: "Google Gemini",
      openai: "OpenAI",
      anthropic: "Anthropic"
    };

    while (!isValid) {
      apiKey = await text({
        message: chalk.blue(`Enter your ${providerNames[providerName]} API key`),
        placeholder: "API Key...",
        validate(value) {
          if (!value || value.trim().length === 0) {
            return "API key cannot be empty";
          }
        },
      });

      let modelOptions = GEMINI_MODELS;
      if (providerName === "openai") modelOptions = OPENAI_MODELS;
      if (providerName === "anthropic") modelOptions = ANTHROPIC_MODELS;

      model = await select({
        message: chalk.blue(`Select ${providerNames[providerName]} model`),
        options: modelOptions,
      });

      const spinner = yoctoSpinner({ text: "Validating API key..." }).start();

      isValid = await aiConfigService.validateApiKey(apiKey, model, providerName);

      if (!isValid) {
        spinner.error("Invalid API key or model");
        console.log(
          boxen(chalk.red("❌ API key validation failed. Please try again with valid credentials."), {
            padding: 1,
            borderStyle: "round",
            borderColor: "red",
          })
        );
      } else {
        spinner.success("API key validated");
      }
    }

    const confirmSave = await confirm({
      message: chalk.yellow("Save this configuration?"),
    });

    if (!confirmSave) {
      console.log(chalk.gray("Configuration not saved."));
      return;
    }

    const saveSpinner = yoctoSpinner({ text: "Saving configuration..." }).start();

    await aiConfigService.setConfig(user.id, apiKey, model, providerName);

    saveSpinner.success("Configuration saved");

    console.log(
      boxen(
        `${chalk.green("✅ AI configuration saved successfully!")}\n\n${chalk.gray("Provider:")} ${chalk.white(providerNames[providerName])}\n${chalk.gray("Model:")} ${chalk.white(model)}\n${chalk.gray("API Key:")} ${chalk.white(apiKey.slice(0, 10) + "...")}`,
        {
          padding: 1,
          margin: 1,
          borderStyle: "round",
          borderColor: "green",
        }
      )
    );
  } catch (error) {
    console.log(
      boxen(chalk.red(`❌ Error: ${error.message}`), {
        padding: 1,
        borderStyle: "round",
        borderColor: "red",
      })
    );
    process.exit(1);
  }
};

const configViewAction = async () => {
  try {
    const user = await getUserFromToken();

    if (!user.aiConfig) {
      console.log(
        boxen(
          `${chalk.yellow("⚠️  No custom AI configuration found")}\n\n${chalk.gray("Using server defaults")}\n${chalk.gray("Run 'orbit config set' to configure your own API key")}`,
          {
            padding: 1,
            borderStyle: "round",
            borderColor: "yellow",
          }
        )
      );
      return;
    }

    console.log(
      boxen(
        `${chalk.bold.cyan("⚙️  Your AI Configuration")}\n\n${chalk.gray("Provider:")} ${chalk.white(user.aiConfig.provider)}\n${chalk.gray("Model:")} ${chalk.white(user.aiConfig.model)}\n${chalk.gray("API Key:")} ${chalk.white(user.aiConfig.apiKey.slice(0, 10) + "...")}\n${chalk.gray("Last Updated:")} ${chalk.white(new Date(user.aiConfig.updatedAt).toLocaleString())}`,
        {
          padding: 1,
          borderStyle: "round",
          borderColor: "cyan",
        }
      )
    );
  } catch (error) {
    console.log(
      boxen(chalk.red(`❌ Error: ${error.message}`), {
        padding: 1,
        borderStyle: "round",
        borderColor: "red",
      })
    );
    process.exit(1);
  }
};

export const configSet = new Command("set")
  .description("Configure your AI provider, API key, and select an AI model")
  .addHelpText('after', `
${chalk.bold.cyan('What this does:')}
  Interactively prompts you to:
  • Select your preferred AI Provider (Gemini, OpenAI, Anthropic)
  • Enter your AI provider API key
  • Select an AI model (e.g., gemini-2.5-flash, gpt-4o, claude-3-5-sonnet)

${chalk.bold.cyan('Examples:')}
  ${chalk.gray('$')} orbit config set

${chalk.bold.cyan('Get your API key:')}
  • Gemini: ${chalk.blue('https://aistudio.google.com/app/apikey')}
  • OpenAI: ${chalk.blue('https://platform.openai.com/api-keys')}
  • Anthropic: ${chalk.blue('https://console.anthropic.com/settings/keys')}

${chalk.bold.cyan('Available models:')}
  • Gemini: 2.5 Flash, 1.5 Pro, etc.
  • OpenAI: GPT-4o, GPT-4o-Mini, etc.
  • Anthropic: Claude 3.5 Sonnet, Claude 3 Opus, etc.
`)
  .action(configSetAction);

export const configView = new Command("view")
  .description("Display your current AI configuration settings")
  .addHelpText('after', `
${chalk.bold.cyan('What this does:')}
  Shows your configured:
  • AI provider (Google)
  • Current model (e.g., gemini-2.5-flash)
  • API key (partially masked for security)

${chalk.bold.cyan('Examples:')}
  ${chalk.gray('$')} orbit config view

${chalk.bold.cyan('Note:')}
  Run ${chalk.green('orbit config set')} to update your configuration.
`)
  .action(configViewAction);

export const config = new Command("config")
  .description("Manage your AI configuration (API keys and model selection)")
  .addHelpText('after', `
${chalk.bold.cyan('Available commands:')}
  set     Configure API key and model
  view    Display current configuration

${chalk.bold.cyan('Examples:')}
  ${chalk.gray('$')} orbit config set ${chalk.dim('# Set up your AI configuration')}
  ${chalk.gray('$')} orbit config view ${chalk.dim('# View current settings')}

${chalk.bold.cyan('Quick start:')}
  1. Get API key: ${chalk.blue('https://aistudio.google.com/app/apikey')}
  2. Run: ${chalk.green('orbit config set')}
  3. Follow the prompts to configure
`)
  .addCommand(configSet)
  .addCommand(configView);
