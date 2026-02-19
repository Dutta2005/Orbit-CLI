import { Command } from "commander";
import chalk from "chalk";
import boxen from "boxen";
import { confirm, isCancel } from "@clack/prompts";
import { historyManager } from "../../utils/history.js";

const historyViewAction = async () => {
  const history = historyManager.getAll();

  if (history.length === 0) {
    console.log(chalk.yellow("\n📜 No command history found\n"));
    return;
  }

  const historyBox = boxen(
    history
      .map((entry, index) => {
        const num = chalk.gray(`${index + 1}.`);
        // Format timestamp as human-readable
        const timestamp = entry.timestamp 
          ? chalk.gray(new Date(entry.timestamp).toLocaleString()) 
          : chalk.gray('(no timestamp)');
        const cmd = chalk.white(entry.cmd || entry); // Fallback for legacy format
        return `${num} ${timestamp} ${cmd}`;
      })
      .join("\n"),
    {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "cyan",
      title: `📜 Command History (${history.length} entries)`,
      titleAlignment: "center",
    }
  );

  console.log(historyBox);
  console.log(chalk.gray(`\nHistory file: ${historyManager.constructor.getHistoryPath()}\n`));
};

const historyClearAction = async () => {
  const history = historyManager.getAll();

  if (history.length === 0) {
    console.log(chalk.yellow("\n📜 No command history to clear\n"));
    return;
  }

  const confirmClear = await confirm({
    message: chalk.yellow(`Are you sure you want to clear ${history.length} history entries?`),
    initialValue: false,
  });

  if (isCancel(confirmClear)) {
    console.log(chalk.gray("\n✖ Cancelled\n"));
    return;
  }

  if (!confirmClear) {
    console.log(chalk.gray("\n✖ Clear cancelled\n"));
    return;
  }

  historyManager.clear();
  console.log(chalk.green("\n✓ Command history cleared\n"));
};

export const historyView = new Command("view")
  .description("Display your command history")
  .addHelpText('after', `
${chalk.bold.cyan('What this does:')}
  Shows all commands you've entered in previous chat sessions.
  
${chalk.bold.cyan('Examples:')}
  ${chalk.gray('$')} orbit history view
  
${chalk.bold.cyan('Note:')}
  History is stored in: ${chalk.blue('~/.orbit_history')}
  Limited to last 100 entries.
`)
  .action(historyViewAction);

export const historyClear = new Command("clear")
  .description("Clear all command history")
  .addHelpText('after', `
${chalk.bold.cyan('What this does:')}
  Permanently deletes all stored command history.
  This cannot be undone.
  
${chalk.bold.cyan('Examples:')}
  ${chalk.gray('$')} orbit history clear
  
${chalk.bold.cyan('Warning:')}
  This will delete the file: ${chalk.blue('~/.orbit_history')}
`)
  .action(historyClearAction);

export const history = new Command("history")
  .description("Manage your command history")
  .addHelpText('after', `
${chalk.bold.cyan('Available commands:')}
  view    Display all command history
  clear   Delete all command history
  
${chalk.bold.cyan('Examples:')}
  ${chalk.gray('$')} orbit history view ${chalk.dim('# View past commands')}
  ${chalk.gray('$')} orbit history clear ${chalk.dim('# Clear all history')}
  
${chalk.bold.cyan('About History:')}
  • Automatically saves all chat messages
  • Persists across CLI sessions
  • Stores up to 100 recent entries
  • Location: ${chalk.blue('~/.orbit_history')}
`)
  .addCommand(historyView)
  .addCommand(historyClear);
