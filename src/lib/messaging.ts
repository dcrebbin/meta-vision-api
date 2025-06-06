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
  AI_CHAT: "ai-chat",
  AI_TTS: "ai-tts",
  AI_VISION: "ai-vision",
  ADD_LOG: "add-log",
  RECEIVE_LOG: "receive-log",
  RECEIVE_MESSAGE: "receive-message",
} as const;

export type Message = (typeof Message)[keyof typeof Message];

interface Messages {
  [Message.AI_CHAT]: (message: string) => Promise<string>;
  [Message.AI_TTS]: (message: string) => Promise<string>;
  [Message.AI_VISION]: (message: {
    base64?: string;
    url?: string;
  }) => Promise<string>;
  [Message.ADD_LOG]: (message: string) => void;
  [Message.RECEIVE_LOG]: (message: Log) => void;
  [Message.RECEIVE_MESSAGE]: (message: string) => void;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<Messages>();
