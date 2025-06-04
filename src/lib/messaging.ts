import { defineExtensionMessaging } from "@webext-core/messaging";

export const Message = {
  OPEN_AI: "open-ai",
  ADD_LOG: "add-log",
  RECEIVE_LOG: "receive-log",
} as const;

export type Message = (typeof Message)[keyof typeof Message];

interface Messages {
  [Message.OPEN_AI]: () => string | null;
  [Message.ADD_LOG]: (message: string) => void;
  [Message.RECEIVE_LOG]: (message: string) => void;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<Messages>();
