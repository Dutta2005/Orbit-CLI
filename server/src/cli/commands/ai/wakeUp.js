import chalk from "chalk";
import { Command } from "commander";
import yoctoSpinner from "yocto-spinner";
import { getStoredToken } from "../auth/login.js";
import prisma from "../../../lib/db.js";
import { select, isCancel } from "@clack/prompts";
import { startChat } from "../../chat/chat-with-ai.js";
import { startToolChat } from "../../chat/chat-with-ai-tool.js";
import { startAgentChat } from "../../chat/chat-with-ai-agent.js";
import { trackCommand } from "../../../lib/analytics.js";

const wakeUpAction = async () => {
  const token = await getStoredToken();

  if (!token?.access_token) {
    console.log(chalk.red("Not authenticated. Please login."));
    return;
  }

  const spinner = yoctoSpinner({ text: "Fetching User Information..." });
  spinner.start();

  const user = await prisma.user.findFirst({
    where: {
      sessions: {
        some: { token: token.access_token },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });

  spinner.stop();

  if (!user) {
    console.log(chalk.red("User not found."));
    return;
  }

  console.log(chalk.green(`\nWelcome back, ${user.name}!\n`));

  const choice = await select({
    message: "Select an option:",
    options: [
      {
        value: "chat",
        label: "Chat",
        hint: "Simple chat with AI",
      },
      {
        value: "tool",
        label: "Tool Calling",
        hint: "Chat with tools (Google Search, Code Execution)",
      },
      {
        value: "agent",
        label: "Agentic Mode",
        hint: "Advanced AI agent (Coming soon)",
      },
    ],
  });

  if (isCancel(choice)) {
    console.log(chalk.yellow("\n👋 Operation cancelled\n"));
    return;
  }

  await trackCommand(user.id, "wakeup", async () => {
    switch (choice) {
      case "chat":
        await startChat("chat");
        break;
      case "tool":
        await startToolChat();
        break;
      case "agent":
        await startAgentChat();
        break;
    }
  });
};

export const wakeUp = new Command("wakeup")
  .description("Start an interactive AI chat session with multiple modes")
  .addHelpText('after', `
${chalk.bold.cyan('What this does:')}
  Launches an interactive AI assistant with three modes:
  • ${chalk.green('Chat')} - Simple conversation with AI
  • ${chalk.green('Tool Calling')} - AI with access to Google Search and code execution
  • ${chalk.green('Agentic Mode')} - Advanced AI agent for code generation

${chalk.bold.cyan('Examples:')}
  ${chalk.gray('$')} orbit wakeup

${chalk.bold.cyan('Prerequisites:')}
  • Must be logged in (run ${chalk.green('orbit login')})
  • Must have API key configured (run ${chalk.green('orbit config set')})

${chalk.bold.cyan('Usage tips:')}
  • Type your message and press Enter
  • Type 'exit' to end the conversation
  • Press Ctrl+C to quit anytime
`)
  .action(wakeUpAction);
