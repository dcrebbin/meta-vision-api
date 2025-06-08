import { create } from "zustand";

interface SessionStore {
  session: {
    isMonitoring: boolean;
    isPermissionGranted: boolean;
    isVideoMonitoring: boolean;
    videoMonitoringInterval: number | null;
    stream: MediaStream | null;
    chatObserver: MutationObserver | null;
  };
  setSession: (session: SessionStore["session"]) => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  session: {
    isMonitoring: false,
    isVideoMonitoring: false,
    isPermissionGranted: false,
    videoMonitoringInterval: null,
    stream: null,
    chatObserver: null,
  },
  setSession: (session) => set({ session }),
}));
