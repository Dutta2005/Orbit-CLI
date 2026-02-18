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
    let apiKey, model;

    while (!isValid) {
      apiKey = await text({
        message: chalk.blue("Enter your Google Gemini API key"),
        placeholder: "AIza...",
        validate(value) {
          if (!value || value.trim().length === 0) {
            return "API key cannot be empty";
          }
          if (!value.startsWith("AIza")) {
            return "Invalid API key format";
          }
        },
      });

      model = await select({
        message: chalk.blue("Select Gemini model"),
        options: GEMINI_MODELS,
      });

      const spinner = yoctoSpinner({ text: "Validating API key..." }).start();

      isValid = await aiConfigService.validateApiKey(apiKey, model);

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

    await aiConfigService.setConfig(user.id, apiKey, model);

    saveSpinner.success("Configuration saved");

    console.log(
      boxen(
        `${chalk.green("✅ AI configuration saved successfully!")}\n\n${chalk.gray("Model:")} ${chalk.white(model)}\n${chalk.gray("API Key:")} ${chalk.white(apiKey.slice(0, 10) + "...")}`,
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
  .description("Set your AI configuration (API key and model)")
  .action(configSetAction);

export const configView = new Command("view")
  .description("View your current AI configuration")
  .action(configViewAction);

export const config = new Command("config")
  .description("Manage AI configuration")
  .addCommand(configSet)
  .addCommand(configView);
