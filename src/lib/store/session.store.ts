//session store

import { create } from "zustand";

interface SessionStore {
  session: {
    isMonitoring: boolean;
    isPermissionGranted: boolean;
    stream: MediaStream | null;
    chatObserver: MutationObserver | null;
    conversationName: string;
  };
  setSession: (session: SessionStore["session"]) => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  session: {
    isMonitoring: false,
    isPermissionGranted: false,
    stream: null,
    chatObserver: null,
    conversationName: "ChatGPT",
  },
  setSession: (session) => set({ session }),
}));
