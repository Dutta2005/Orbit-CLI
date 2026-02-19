import readline from "readline";
import chalk from "chalk";
import { historyManager } from "./history.js";

/**
 * Custom readline-based input with history support
 * @param {Object} options - Input options
 * @param {string} options.message - The prompt message
 * @param {string} options.placeholder - Placeholder text
 * @param {Function} options.validate - Validation function
 * @returns {Promise<string>} The user input
 */
export function textWithHistory(options = {}) {
  return new Promise((resolve, reject) => {
    const { message = "Input", placeholder = "", validate } = options;

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      history: historyManager.getAll().reverse(), // readline expects reverse order
      historySize: 100,
      prompt: `${message}: `,
    });

    // Display the prompt
    console.log(); // Empty line for spacing
    rl.setPrompt(chalk.blue(`${message}: `));
    if (placeholder) {
      console.log(chalk.gray(`  (${placeholder})`));
    }
    rl.prompt();

    let inputValue = "";

    rl.on("line", async (input) => {
      inputValue = input.trim();

      // Handle exit commands
      if (inputValue.toLowerCase() === "exit" || inputValue.toLowerCase() === "quit") {
        rl.close();
        resolve(null); // Signal cancellation
        return;
      }

      // Validate input if validator provided
      if (validate) {
        const error = validate(inputValue);
        if (error) {
          console.log(chalk.red(`✖ ${error}`));
          rl.prompt();
          return;
        }
      }

      // Add to history if valid
      if (inputValue.length > 0) {
        historyManager.add(inputValue);
      }

      rl.close();
      resolve(inputValue);
    });

    rl.on("SIGINT", () => {
      console.log();
      rl.close();
      resolve(null); // Signal cancellation
    });

    rl.on("close", () => {
      // Clean up
    });
  });
}

/**
 * Check if input was cancelled
 * @param {any} value - The value to check
 * @returns {boolean}
 */
export function isHistoryCancel(value) {
  return value === null;
}
