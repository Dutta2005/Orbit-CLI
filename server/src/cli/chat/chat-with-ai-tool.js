import chalk from "chalk";
import boxen from "boxen";
import { text, isCancel, cancel, intro, outro, multiselect, select } from "@clack/prompts";
import yoctoSpinner from "yocto-spinner";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import { AIService } from "../ai/ai-service.js";
import { ChatService } from "../../services/chat.services.js";
import { AiConfigService } from "../../services/aiConfig.services.js";
import { getStoredToken } from "../commands/auth/login.js";
import prisma from "../../lib/db.js";
import { historyManager } from "../utils/history.js";
import {
  availableTools,
  getEnabledTools,
  enableTools,
  getEnabledToolNames,
  resetTools
} from "../../config/tool.config.js";

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

const aiConfigService = new AiConfigService();
const chatService = new ChatService();

async function getUserFromToken() {
  const token = await getStoredToken();

  if (!token?.access_token) {
    throw new Error("Not authenticated. Please run 'orbit login' first.");
  }

  const spinner = yoctoSpinner({ text: "Authenticating..." }).start();

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
    spinner.error("User not found");
    throw new Error("User not found. Please login again.");
  }

  spinner.success(`Welcome back, ${user.name}!`);
  return user;
}

async function selectTools() {
  const toolOptions = availableTools.map(tool => ({
    value: tool.id,
    label: tool.name,
    hint: tool.description,
  }));

  const selectedTools = await multiselect({
    message: chalk.cyan("Select tools to enable (Space to select, Enter to confirm):"),
    options: toolOptions,
    required: false,
  });

  if (isCancel(selectedTools)) {
    cancel(chalk.yellow("Tool selection cancelled"));
    process.exit(0);
  }

  enableTools(selectedTools);

  if (selectedTools.length === 0) {
    console.log(chalk.yellow("\n⚠️  No tools selected. AI will work without tools.\n"));
  } else {
    const toolsBox = boxen(
      chalk.green(`✅ Enabled tools:\n${selectedTools.map(id => {
        const tool = availableTools.find(t => t.id === id);
        return `  • ${tool.name}`;
      }).join('\n')}`),
      {
        padding: 1,
        margin: { top: 1, bottom: 1 },
        borderStyle: "round",
        borderColor: "green",
        title: "🛠️  Active Tools",
        titleAlignment: "center",
      }
    );
    console.log(toolsBox);
  }

  return selectedTools.length > 0;
}

async function initConversation(userId, conversationId = null, mode = "tool") {
  const spinner = yoctoSpinner({ text: "Loading conversation..." }).start();

  const conversation = await chatService.getOrCreateConversation(
    userId,
    conversationId,
    mode
  );

  spinner.success("Conversation loaded");

  const enabledToolNames = getEnabledToolNames();
  const toolsDisplay = enabledToolNames.length > 0
    ? `\n${chalk.gray("Active Tools:")} ${enabledToolNames.join(", ")}`
    : `\n${chalk.gray("No tools enabled")}`;

  const conversationInfo = boxen(
    `${chalk.bold("Conversation")}: ${conversation.title}\n${chalk.gray("ID: " + conversation.id)}\n${chalk.gray("Mode: " + conversation.mode)}${toolsDisplay}`,
    {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "cyan",
      title: "💬 Tool Calling Session",
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
    } else if (msg.role === "assistant") {
      const renderedContent = marked.parse(msg.content);
      const assistantBox = boxen(renderedContent.trim(), {
        padding: 1,
        margin: { left: 2, bottom: 1 },
        borderStyle: "round",
        borderColor: "green",
        title: "🤖 Assistant (with tools)",
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

  const tools = getEnabledTools();

  let fullResponse = "";
  let isFirstChunk = true;
  const toolCallsDetected = [];

  try {
    const result = await aiService.sendMessage(
      aiMessages,
      (chunk) => {
        if (isFirstChunk) {
          spinner.success("Response received");
          process.stdout.write("\n");
          const header = chalk.green.bold("🤖 Assistant:");
          console.log(header);
          console.log(chalk.gray("─".repeat(60)));
          isFirstChunk = false;
        }
        process.stdout.write(chunk);
        fullResponse += chunk;
      },
      tools,
      (toolCall) => {
        toolCallsDetected.push(toolCall);
      }
    );

    if (toolCallsDetected.length > 0) {
      console.log("\n");
      const toolCallBox = boxen(
        toolCallsDetected.map(tc =>
          `${chalk.cyan("🔧 Tool:")} ${tc.toolName}\n${chalk.gray("Args:")} ${JSON.stringify(tc.args, null, 2)}`
        ).join("\n\n"),
        {
          padding: 1,
          margin: 1,
          borderStyle: "round",
          borderColor: "cyan",
          title: "🛠️  Tool Calls",
        }
      );
      console.log(toolCallBox);
    }

    if (result.toolResults && result.toolResults.length > 0) {
      const toolResultBox = boxen(
        result.toolResults.map(tr =>
          `${chalk.green("✅ Tool:")} ${tr.toolName}\n${chalk.gray("Result:")} ${JSON.stringify(tr.result, null, 2).slice(0, 200)}...`
        ).join("\n\n"),
        {
          padding: 1,
          margin: 1,
          borderStyle: "round",
          borderColor: "green",
          title: "📊 Tool Results",
        }
      );
      console.log(toolResultBox);
    }

    console.log("\n");
    // const renderedMarkdown = marked.parse(fullResponse);
    // console.log(renderedMarkdown);
    console.log(chalk.gray("─".repeat(60)));
    console.log("\n");

    return fullResponse;
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
    if (!fullResponse && error.message?.toLowerCase().includes("stream")) {
      console.log(chalk.yellow("Streaming failed, retrying without streaming..."));
      const result = await aiService.getMessage(aiMessages);
      const header = chalk.green.bold("🤖 Assistant:");
      console.log("\n" + header);
      console.log(chalk.gray("─".repeat(60)));
      process.stdout.write(result);
      console.log("\n");
      console.log(chalk.gray("─".repeat(60)));
      console.log("\n");
      return result;
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
  const enabledToolNames = getEnabledToolNames();
  const helpBox = boxen(
    `${chalk.gray('• Type your message and press Enter')}\n${chalk.gray('• AI has access to:')} ${enabledToolNames.length > 0 ? enabledToolNames.join(", ") : "No tools"}\n${chalk.gray('• Type "exit" to end conversation')}\n${chalk.gray('• Press Ctrl+C to quit anytime')}`,
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

    const userBox = boxen(chalk.white(userInput), {
      padding: 1,
      margin: { left: 2, top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "blue",
      title: "👤 You",
      titleAlignment: "left",
    });
    console.log(userBox);

    await saveMessage(conversation.id, "user", userInput);
    const messages = await chatService.getMessages(conversation.id);

    let aiResponse;
    try {
      aiResponse = await getAIResponse(conversation.id, aiService);
    } catch (error) {
      // The error is already printed via getAIResponse gracefully.
      // We just need to terminate the loop and CLI entirely.
      resetTools();
      process.exit(1);
    }

    await saveMessage(conversation.id, "assistant", aiResponse);
    await updateConversationTitle(conversation.id, userInput, messages.length);
  }
}

export async function startToolChat(user, conversationId = null) {
  try {
    intro(
      boxen(chalk.bold.cyan("🛠️  Orbit AI - Tool Calling Mode"), {
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
    // If user selects a different provider than saved, clear apiKey/model
    // so the provider uses its own defaults
    if (userConfig.provider && userConfig.provider !== providerChoice) {
      userConfig.apiKey = undefined;
      userConfig.model = undefined;
    }
    userConfig.provider = providerChoice;

    const aiService = new AIService(userConfig, user.id);

    await selectTools();

    // if (providerChoice === "google") {
    //   await selectTools();
    // } else {
    //   resetTools();
    //   const providerName = providerChoice === "openai" ? "OpenAI" : "Anthropic";
    //   console.log(
    //     boxen(
    //       chalk.yellow(
    //         `⚠️  Tool calling is currently configured with Google-only built-in tools.\n` +
    //         `${providerName} will run in chat-only mode for this session.`
    //       ),
    //       {
    //         padding: 1,
    //         margin: { top: 1, bottom: 1 },
    //         borderStyle: "round",
    //         borderColor: "yellow",
    //         title: "Provider Compatibility",
    //         titleAlignment: "center",
    //       }
    //     )
    //   );
    // }

    const conversation = await initConversation(user.id, conversationId, "tool");
    await chatLoop(conversation, aiService);

    resetTools();

    outro(chalk.green("✨ Thanks for using tools!"));
  } catch (error) {
    resetTools();
    if (!error.message?.includes("API_KEY") && !error.message?.includes("key") && error.statusCode !== 401 && error.statusCode !== 403) {
      const errorBox = boxen(chalk.red(`❌ Error: ${error.message}`), {
        padding: 1, margin: 1, borderStyle: "round", borderColor: "red",
      });
      console.log(errorBox);
    }
    process.exit(1);
  }
}
