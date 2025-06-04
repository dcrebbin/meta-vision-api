import { defineExtensionMessaging } from "@webext-core/messaging";

export const Message = {
  OPEN_AI: "open-ai",
} as const;

export type Message = (typeof Message)[keyof typeof Message];

interface Messages {
  [Message.OPEN_AI]: () => string | null;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<Messages>();
