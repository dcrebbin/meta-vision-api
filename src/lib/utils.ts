import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Message, sendMessage } from "./messaging";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export function logMessage(message: string) {
  logToConsole(message);
  sendMessage(Message.ADD_LOG, message);
}

export function logError(message: string) {
  console.error(`[mai api] ${message}`);
}

export function logToConsole(message: string) {
  console.log(`[mai api] ${message}`);
}
