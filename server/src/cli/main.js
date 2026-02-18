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
  console.log(chalk.gray("A Cli based AI tool \n"));

  const program = new Command("orbit");

  program
    .version("0.0.1")
    .description("Orbit CLI - Device Flow Authentication");

  program.addCommand(wakeUp);
  program.addCommand(login);
  program.addCommand(logout);
  program.addCommand(whoami);
  program.addCommand(config);

  program.action(() => {
    program.help();
  });

  program.parse();
}

main().catch((error) => {
  console.error(chalk.red("Error running Orbit CLI:"), error);
  process.exit(1);
});
