import chalk from "chalk";

function getTime(): string {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    const ms = String(now.getMilliseconds()).padStart(3, "0");
    return `${hh}:${mm}:${ss}.${ms}`;
}

function formatMessage(level: string, message: string): string {
    return `[${getTime()}] [${level.toUpperCase()}] ${message}`;
}

export const log = {
    debug: (message: string, ...args: any[]) => {
        console.debug(chalk.cyan(formatMessage("debug", message)), ...args);
    },
    info: (message: string, ...args: any[]) => {
        console.info(chalk.green(formatMessage("info", message)), ...args);
    },
    warn: (message: string, ...args: any[]) => {
        console.warn(chalk.yellow(formatMessage("warn", message)), ...args);
    },
    error: (message: string, ...args: any[]) => {
        console.error(chalk.red(formatMessage("error", message)), ...args);
    }
}
