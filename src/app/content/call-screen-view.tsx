import { Message, sendMessage } from "@/lib/messaging";
import { useSessionStore } from "@/lib/store/session.store";
import { useSettingsStore } from "@/lib/store/settings.store";
import { logMessage } from "@/lib/utils";
import { Video, VideoOff } from "lucide-react";
import { useCallback, useEffect } from "react";
import { ChatModelSettings } from "./components/chat-model-settings";
import { ChatProviderSettings } from "./components/chat-provider-settings";
import { SystemPromptSettings } from "./components/system-prompt-settings";

/**
 * Creates a PNG data-URL of the current frame of the first <video> that is
 * currently visible (display: block). This matches the existing DOM structure
 * without requiring a ref to be threaded down from elsewhere.
 */
async function createScreenshot(): Promise<string | null> {
  const video = document.querySelector(
    "video[style='display: block;']"
  ) as HTMLVideoElement | null;
  if (!video) return null;

  // Non-standard APIs are still the most concise way to capture a single frame.
  // We fall back gracefully if the browser does not support them.
  // @ts-expect-error – captureStream is not (yet) typed in lib.dom.d.ts
  const track = video.captureStream?.().getVideoTracks?.()[0] as
    | MediaStreamTrack
    | undefined;
  if (!track) return null;

  // @ts-expect-error – ImageCapture is not (yet) typed in lib.dom.d.ts
  const imageCapture = new ImageCapture(track);
  const bitmap = await imageCapture.grabFrame();

  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  ctx?.drawImage(bitmap, 0, 0);

  return canvas.toDataURL("image/png");
}

function downloadDataUrl(dataUrl: string, filename = "screenshot.png") {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export function CallScreenView() {
  const { session, setSession } = useSessionStore();
  const { settings } = useSettingsStore();

  const sendImageToServer = useCallback(async (base64Image: string) => {
    try {
      const response = await sendMessage(Message.AI_VISION, {
        base64: base64Image,
      });
      logMessage(response);
    } catch (error) {
      throw error;
    }
  }, []);

  const takeScreenshot = useCallback(
    async (opts: { saveToFile?: boolean; sendToServer?: boolean } = {}) => {
      const { saveToFile = false, sendToServer = true } = opts;
      const dataUrl = await createScreenshot();
      if (!dataUrl) return;
      try {
        if (sendToServer) await sendImageToServer(dataUrl);
      } catch (error) {
        logMessage(error as string);
        alert(error as string);
        stopMonitoring();
      }
      if (saveToFile) downloadDataUrl(dataUrl);
    },
    [sendImageToServer]
  );

  function hasVideoElement() {
    const video = document.querySelector(
      "video[style='display: block;']"
    ) as HTMLVideoElement | null;
    return video !== null;
  }

  const startMonitoring = useCallback(() => {
    if (!hasVideoElement()) {
      alert("No video element found. Please check if you are in a call.");
      return;
    }

    if (session.isVideoMonitoring) return;

    const intervalId = window.setInterval(() => {
      logMessage("Sending screenshot to server");
      takeScreenshot({ sendToServer: true });
    }, settings.videoCaptureInterval);

    setSession({
      ...session,
      isVideoMonitoring: true,
      videoMonitoringInterval: intervalId,
    });
  }, [
    session.isVideoMonitoring,
    settings.videoCaptureInterval,
    setSession,
    takeScreenshot,
  ]);

  const stopMonitoring = useCallback(() => {
    if (session.videoMonitoringInterval) {
      clearInterval(session.videoMonitoringInterval);
    }
    setSession({
      ...session,
      isVideoMonitoring: false,
      videoMonitoringInterval: null,
    });
  }, [session.videoMonitoringInterval, setSession]);

  useEffect(() => {
    return () => {
      if (session.videoMonitoringInterval) {
        clearInterval(session.videoMonitoringInterval);
      }
    };
  }, [session.videoMonitoringInterval]);

  return (
    <div className="flex flex-col gap-2 fixed bottom-0 left-0 p-4">
      <div className="flex gap-2">
        <button
          className="flex cursor-pointer h-12 items-center gap-2 rounded-md bg-white p-2 font-sans text-black drop-shadow-md"
          onClick={session.isVideoMonitoring ? stopMonitoring : startMonitoring}
        >
          {session.isVideoMonitoring
            ? "Stop Monitoring Video"
            : "Start Monitoring Video"}
          {session.isVideoMonitoring ? <VideoOff /> : <Video />}
        </button>
      </div>

      <div className="flex gap-2 rounded-md bg-white p-2 drop-shadow-md">
        <ChatProviderSettings darkMode={false} />
        <ChatModelSettings darkMode={false} />
        <SystemPromptSettings darkMode={false} />
      </div>
    </div>
  );
}
