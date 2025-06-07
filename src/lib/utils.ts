import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Message, sendMessage } from "./messaging";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export function logMessage(message: string) {
  logMessageToConsole(message);
  sendMessage(Message.ADD_LOG, message);
}

export function logError(message: string) {
  logErrorToConsole(message);
  sendMessage(Message.ADD_LOG, message);
}

function logErrorToConsole(message: string) {
  console.error(`[mai api] ${message}`);
}

function logMessageToConsole(message: string) {
  console.log(`[mai api] ${message}`);
}
