import chalk from "chalk";

export function logError(err) {
  console.log(chalk.red.bold("❌ [ERROR]"), chalk.italic(err.name + ":"), err.message);
  console.log(chalk.yellow.bold("Stack trace:"));
  console.log(err.stack.split("\n").slice(1).join("\n"), "\n")
}