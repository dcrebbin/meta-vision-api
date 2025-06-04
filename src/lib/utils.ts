import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { User } from "~/types";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const getName = (user: User) => {
  const identity = user.identities?.[0]?.identity_data;
  const name: unknown =
    user.user_metadata.name ||
    identity?.name ||
    identity?.full_name ||
    identity?.user_name ||
    identity?.preferred_username;

  const nameFromEmail = user.email?.split("@")[0];

  return typeof name === "string"
    ? name
    : nameFromEmail
      ? nameFromEmail
      : undefined;
};

export const getAvatar = (user: User) => {
  const identity = user.identities?.[0]?.identity_data;

  const avatar: unknown = identity?.avatar_url || user.user_metadata.avatar_url;

  return typeof avatar === "string" ? avatar : undefined;
};
