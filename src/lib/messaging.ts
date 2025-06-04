import { defineExtensionMessaging } from "@webext-core/messaging";
import type { User } from "~/types";

export const Message = {
  USER: "user",
} as const;

export type Message = (typeof Message)[keyof typeof Message];

interface Messages {
  [Message.USER]: () => User | null;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<Messages>();
