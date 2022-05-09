import chalk from "chalk";

export function logError(err) {
  if (process.env.NODE_ENV === "test") return;
  console.log(chalk.red.bold("❌ [ERROR]"), chalk.italic(err.name + ":"), err.message);
  console.log(chalk.yellow.bold("Stack trace:"));
  console.log(err.stack.split("\n").slice(1).join("\n"), "\n")
}

export function logInfo(msg) {
  if (process.env.NODE_ENV === "test") return;
  console.log(chalk.blue.bold("ℹ️ [INFO]"), chalk.cyan(msg));
}