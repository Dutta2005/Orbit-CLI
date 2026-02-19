#!/usr/bin/env node

import dotenv from "dotenv";
dotenv.config();

import chalk from "chalk";
import figlet from "figlet";
import { Command } from "commander";
import { validateEnv } from "../config/env.config.js";
import { login, logout, whoami } from "./commands/auth/login.js";
import { config } from "./commands/config/config.js";
import { wakeUp } from "./commands/ai/wakeUp.js";
import { history } from "./commands/history/history.js";

validateEnv();

async function main() {
  console.log(
    chalk.cyan(
      figlet.textSync("Orbit CLI", {
        font: "Standard",
        horizontalLayout: "default",
      })
    )
  );
  console.log(chalk.gray("A powerful CLI-based AI assistant with authentication and configuration management\n"));

  const program = new Command("orbit");

  program
    .version("0.0.1")
    .description("Orbit CLI - Your AI-powered command-line assistant")
    .usage("<command> [options]")
    .addHelpText('after', `
${chalk.bold.cyan('Examples:')}
  ${chalk.gray('$')} orbit login ${chalk.dim('# Authenticate with GitHub OAuth')}
  ${chalk.gray('$')} orbit wakeup ${chalk.dim('# Start chatting with AI')}
  ${chalk.gray('$')} orbit config set ${chalk.dim('# Configure your API key and model')}
  ${chalk.gray('$')} orbit history view ${chalk.dim('# View your command history')}

${chalk.bold.cyan('Getting Started:')}
  1. Run ${chalk.green('orbit login')} to authenticate
  2. Run ${chalk.green('orbit config set')} to configure your AI settings
  3. Run ${chalk.green('orbit wakeup')} to start using AI features

${chalk.bold.cyan('Documentation:')}
  ${chalk.blue('https://github.com/Dutta2005/Orbit-CLI#readme')}
`);

  program.addCommand(wakeUp);
  program.addCommand(login);
  program.addCommand(logout);
  program.addCommand(whoami);
  program.addCommand(config);
  program.addCommand(history);

  program.action(() => {
    program.help();
  });

  program.parse();
}

main().catch((error) => {
  console.error(chalk.red("Error running Orbit CLI:"), error);
  process.exit(1);
});
