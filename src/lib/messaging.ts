import { defineExtensionMessaging } from "@webext-core/messaging";

export class Log {
  message: string = "";
  timestamp: number = 0;

  constructor(message: string, timestamp: number) {
    this.message = message;
    this.timestamp = timestamp;
  }

  static fromJSON(json: string): Log[] {
    try {
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.map((item) => {
        if (typeof item === "string") {
          const parsedItem = JSON.parse(item) as Log;
          return new Log(parsedItem.message, parsedItem.timestamp);
        }
        if (
          typeof item === "object" &&
          item !== null &&
          "message" in item &&
          "timestamp" in item
        ) {
          return new Log(item.message as string, item.timestamp as number);
        }
        return new Log("", 0);
      });
    } catch (error) {
      console.error("Error parsing logs:", error);
      return [];
    }
  }
}

export const Message = {
  OPEN_AI: "open-ai",
  ADD_LOG: "add-log",
  RECEIVE_LOG: "receive-log",
} as const;

export type Message = (typeof Message)[keyof typeof Message];

interface Messages {
  [Message.OPEN_AI]: () => string | null;
  [Message.ADD_LOG]: (message: string) => void;
  [Message.RECEIVE_LOG]: (message: Log) => void;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<Messages>();
