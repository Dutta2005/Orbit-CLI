import chalk from "chalk";
import boxen from "boxen";
import { text, isCancel, cancel, intro, outro, confirm, select } from "@clack/prompts";
import { AIService } from "../ai/ai-service.js";
import { ChatService } from "../../services/chat.services.js";
import { getStoredToken } from "../commands/auth/login.js";
import prisma from "../../lib/db.js";
import { generateApplication } from "../../config/agent.config.js";
import { AiConfigService } from "../../services/aiConfig.services.js";
import { historyManager } from "../utils/history.js";

const aiConfigService = new AiConfigService();
const chatService = new ChatService();


async function initConversation(userId, conversationId = null) {
  const conversation = await chatService.getOrCreateConversation(
    userId,
    conversationId,
    "agent"
  );

  const conversationInfo = boxen(
    `${chalk.bold("Conversation")}: ${conversation.title}\n` +
    `${chalk.gray("ID:")} ${conversation.id}\n` +
    `${chalk.gray("Mode:")} ${chalk.magenta("Agent (Code Generator)")}\n` +
    `${chalk.cyan("Working Directory:")} ${process.cwd()}`,
    {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "magenta",
      title: "🤖 Agent Mode",
      titleAlignment: "center",
    }
  );

  console.log(conversationInfo);

  return conversation;
}

async function saveMessage(conversationId, role, content) {
  return await chatService.addMessage(conversationId, role, content);
}

async function agentLoop(conversation, aiService) {
  const helpBox = boxen(
    `${chalk.cyan.bold("What can the agent do?")}\n\n` +
    `${chalk.gray('• Generate complete applications from descriptions')}\n` +
    `${chalk.gray('• Create all necessary files and folders')}\n` +
    `${chalk.gray('• Include setup instructions and commands')}\n` +
    `${chalk.gray('• Generate production-ready code')}\n\n` +
    `${chalk.yellow.bold("Examples:")}\n` +
    `${chalk.white('• "Build a todo app with React and Tailwind"')}\n` +
    `${chalk.white('• "Create a REST API with Express and MongoDB"')}\n` +
    `${chalk.white('• "Make a weather app using OpenWeatherMap API"')}\n\n` +
    `${chalk.gray('Type "exit" to end the session')}`,
    {
      padding: 1,
      margin: { bottom: 1 },
      borderStyle: "round",
      borderColor: "cyan",
      title: "💡 Agent Instructions",
    }
  );

  console.log(helpBox);

  while (true) {
    const userInput = await text({
      message: chalk.magenta("🤖 What would you like to build?"),
      placeholder: "Describe your application...",
      validate(value) {
        if (!value || value.trim().length === 0) {
          return "Description cannot be empty";
        }
        if (value.trim().length < 10) {
          return "Please provide more details (at least 10 characters)";
        }
      },
    });

    if (isCancel(userInput)) {
      console.log(chalk.yellow("\n👋 Agent session cancelled\n"));
      process.exit(0);
    }

    if (userInput.toLowerCase() === "exit") {
      console.log(chalk.yellow("\n👋 Agent session ended\n"));
      break;
    }

    // Save to history
    historyManager.add(userInput);

    const userBox = boxen(chalk.white(userInput), {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "blue",
      title: "👤 Your Request",
      titleAlignment: "left",
    });
    console.log(userBox);

    // Save user message
    await saveMessage(conversation.id, "user", userInput);

    try {
      // Generate application using structured output
      const result = await generateApplication(
        userInput,
        aiService,
        process.cwd()
      );

      if (result && result.success) {
        // Save successful generation details
        const responseMessage = `Generated application: ${result.folderName}\n` +
          `Files created: ${result.files.length}\n` +
          `Location: ${result.appDir}\n\n` +
          `Setup commands:\n${result.commands.join('\n')}`;

        await saveMessage(conversation.id, "assistant", responseMessage);

        // Ask if user wants to generate another app
        const continuePrompt = await confirm({
          message: chalk.cyan("Would you like to generate another application?"),
          initialValue: false,
        });

        if (isCancel(continuePrompt) || !continuePrompt) {
          console.log(chalk.yellow("\n👋 Great! Check your new application.\n"));
          break;
        }

      } else {
        throw new Error("Generation returned no result");
      }

    } catch (error) {
      if (!error.message?.includes("API_KEY") && !error.message?.includes("key") && error.statusCode !== 401 && error.statusCode !== 403) {
        console.log(boxen(chalk.red(`❌ AI Error: ${error.message}`), {
          padding: 1, margin: 1, borderStyle: "round", borderColor: "red"
        }));
      } else {
        console.log(boxen(chalk.red("❌ Authentication Error: Invalid or missing API Key.\nPlease check your configuration using 'orbit config set'."), {
          padding: 1, margin: 1, borderStyle: "round", borderColor: "red"
        }));
      }

      await saveMessage(conversation.id, "assistant", `Error: ${error.message}`);
      process.exit(1);
    }
  }
}

export async function startAgentChat(user, conversationId = null) {
  try {
    intro(
      boxen(
        chalk.bold.magenta("🤖 Orbit AI - Agent Mode\n\n") +
        chalk.gray("Autonomous Application Generator"),
        {
          padding: 1,
          borderStyle: "double",
          borderColor: "magenta",
        }
      )
    );



    const providerChoice = await select({
      message: chalk.cyan("Select your AI model provider:"),
      options: [
        { value: "google", label: "Google Gemini (Default)", hint: "Recommended" },
        { value: "openai", label: "OpenAI GPT" },
        { value: "anthropic", label: "Anthropic Claude" }
      ],
      initialValue: "google"
    });

    if (isCancel(providerChoice)) {
      console.log(chalk.yellow("Chat cancelled."));
      process.exit(0);
    }

    const userConfig = user.aiConfig || {};
    // If user selects a different provider than saved, clear apiKey/model
    // so the provider uses its own defaults
    if (userConfig.provider && userConfig.provider !== providerChoice) {
      userConfig.apiKey = undefined;
      userConfig.model = undefined;
    }
    userConfig.provider = providerChoice;

    const aiService = new AIService(userConfig, user.id);

    // Warning about file system access
    const shouldContinue = await confirm({
      message: chalk.yellow("⚠️  The agent will create files and folders in the current directory. Continue?"),
      initialValue: true,
    });

    if (isCancel(shouldContinue) || !shouldContinue) {
      cancel(chalk.yellow("Agent mode cancelled"));
      process.exit(0);
    }

    const conversation = await initConversation(user.id, conversationId);
    await agentLoop(conversation, aiService);

    outro(chalk.green.bold("\n✨ Thanks for using Agent Mode!"));

  } catch (error) {
    process.exit(1);
  }
}