import chalk from "chalk";
import boxen from "boxen";
import { text, isCancel, intro, outro, select } from "@clack/prompts";
import yoctoSpinner from "yocto-spinner";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import { AIService } from "../ai/ai-service.js";
import { ChatService } from "../../services/chat.services.js";
import { AiConfigService } from "../../services/aiConfig.services.js";
import { getStoredToken } from "../commands/auth/login.js";
import prisma from "../../lib/db.js";
import { historyManager } from "../utils/history.js";

marked.use(
  markedTerminal({
    code: chalk.cyan,
    blockquote: chalk.gray.italic,
    heading: chalk.green.bold,
    firstHeading: chalk.magenta.underline.bold,
    hr: chalk.reset,
    listitem: chalk.reset,
    list: chalk.reset,
    paragraph: chalk.reset,
    strong: chalk.bold,
    em: chalk.italic,
    codespan: chalk.yellow.bgBlack,
    del: chalk.dim.gray.strikethrough,
    link: chalk.blue.underline,
    href: chalk.blue.underline,
  })
);

const chatService = new ChatService();
const aiConfigService = new AiConfigService();



async function initConversation(userId, conversationId = null, mode = "chat") {
  const spinner = yoctoSpinner({ text: "Loading conversation..." }).start();

  const conversation = await chatService.getOrCreateConversation(
    userId,
    conversationId,
    mode
  );

  spinner.success("Conversation loaded");

  const conversationInfo = boxen(
    `${chalk.bold("Conversation")}: ${conversation.title}\n${chalk.gray("ID: " + conversation.id)}\n${chalk.gray("Mode: " + conversation.mode)}`,
    {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "cyan",
      title: "💬 Chat Session",
      titleAlignment: "center",
    }
  );

  console.log(conversationInfo);

  if (conversation.messages?.length > 0) {
    console.log(chalk.yellow("📜 Previous messages:\n"));
    displayMessages(conversation.messages);
  }

  return conversation;
}

function displayMessages(messages) {
  messages.forEach((msg) => {
    if (msg.role === "user") {
      const userBox = boxen(chalk.white(msg.content), {
        padding: 1,
        margin: { left: 2, bottom: 1 },
        borderStyle: "round",
        borderColor: "blue",
        title: "👤 You",
        titleAlignment: "left",
      });
      console.log(userBox);
    } else {
      const renderedContent = marked.parse(msg.content);
      const assistantBox = boxen(renderedContent.trim(), {
        padding: 1,
        margin: { left: 2, bottom: 1 },
        borderStyle: "round",
        borderColor: "green",
        title: "🤖 Assistant",
        titleAlignment: "left",
      });
      console.log(assistantBox);
    }
  });
}

async function saveMessage(conversationId, role, content) {
  return await chatService.addMessage(conversationId, role, content);
}

async function getAIResponse(conversationId, aiService) {
  const spinner = yoctoSpinner({
    text: "AI is thinking...",
    color: "cyan"
  }).start();

  const dbMessages = await chatService.getMessages(conversationId);
  const aiMessages = chatService.formatMessagesForAI(dbMessages);

  let fullResponse = "";
  let isFirstChunk = true;

  try {
    const result = await aiService.sendMessage(aiMessages, (chunk) => {
      if (isFirstChunk) {
        spinner.stop();
        console.log("\n");
        const header = chalk.green.bold("🤖 Assistant:");
        console.log(header);
        console.log(chalk.gray("─".repeat(60)));
        isFirstChunk = false;
      }
      fullResponse += chunk;
    });

    console.log("\n");
    const renderedMarkdown = marked.parse(fullResponse);
    console.log(renderedMarkdown);
    console.log(chalk.gray("─".repeat(60)));
    console.log("\n");

    return result.content;
  } catch (error) {
    spinner.error("Failed to get AI response");
    if (error.statusCode === 401 || error.statusCode === 403 || error.message?.includes("API_KEY") || error.message?.includes("key")) {
      console.log(boxen(chalk.red("❌ Authentication Error: Invalid or missing API Key.\nPlease check your configuration using 'orbit config set'."), {
        padding: 1, margin: 1, borderStyle: "round", borderColor: "red"
      }));
    } else {
      console.log(boxen(chalk.red(`❌ AI Error: ${error.message}`), {
        padding: 1, margin: 1, borderStyle: "round", borderColor: "red"
      }));
    }
    throw error;
  }
}

async function updateConversationTitle(conversationId, userInput, messageCount) {
  if (messageCount === 1) {
    const title = userInput.slice(0, 50) + (userInput.length > 50 ? "..." : "");
    await chatService.updateTitle(conversationId, title);
  }
}

async function chatLoop(conversation, aiService) {
  const helpBox = boxen(
    `${chalk.gray('• Type your message and press Enter')}\n${chalk.gray('• Markdown formatting is supported in responses')}\n${chalk.gray('• Type "exit" to end conversation')}\n${chalk.gray('• Press Ctrl+C to quit anytime')}`,
    {
      padding: 1,
      margin: { bottom: 1 },
      borderStyle: "round",
      borderColor: "gray",
      dimBorder: true,
    }
  );

  console.log(helpBox);

  while (true) {
    const userInput = await text({
      message: chalk.blue("💬 Your message"),
      placeholder: "Type your message...",
      validate(value) {
        if (!value || value.trim().length === 0) {
          return "Message cannot be empty";
        }
      },
    });

    if (isCancel(userInput)) {
      const exitBox = boxen(chalk.yellow("Chat session ended. Goodbye! 👋"), {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "yellow",
      });
      console.log(exitBox);
      process.exit(0);
    }

    if (userInput.toLowerCase() === "exit") {
      const exitBox = boxen(chalk.yellow("Chat session ended. Goodbye! 👋"), {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "yellow",
      });
      console.log(exitBox);
      break;
    }

    // Save to history
    historyManager.add(userInput);

    await saveMessage(conversation.id, "user", userInput);
    const messages = await chatService.getMessages(conversation.id);

    let aiResponse;
    try {
      aiResponse = await getAIResponse(conversation.id, aiService);
    } catch (error) {
      // The error is already printed via getAIResponse gracefully.
      // We just need to terminate the loop and CLI entirely.
      process.exit(1);
    }

    await saveMessage(conversation.id, "assistant", aiResponse);
    await updateConversationTitle(conversation.id, userInput, messages.length);
  }
}

export async function startChat(user, mode = "chat", conversationId = null) {
  try {
    intro(
      boxen(chalk.bold.cyan("🚀 Orbit AI Chat"), {
        padding: 1,
        borderStyle: "double",
        borderColor: "cyan",
      })
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
    userConfig.provider = providerChoice;

    const aiService = new AIService(userConfig, user.id);
    const conversation = await initConversation(user.id, conversationId, mode);
    await chatLoop(conversation, aiService);

    outro(chalk.green("✨ Thanks for chatting!"));
  } catch (error) {
    // If the error was already printed beautifully in getAIResponse, we just exit.
    // Otherwise we print a fallback.
    if (!error.message?.includes("API_KEY") && !error.message?.includes("key") && error.statusCode !== 401 && error.statusCode !== 403) {
      const errorBox = boxen(chalk.red(`❌ Error: ${error.message}`), {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "red",
      });
      console.log(errorBox);
    }
    process.exit(1);
  }
}
