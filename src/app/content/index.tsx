import { Button } from "@/components/ui/button";
import ReactDOM from "react-dom/client";
import { createShadowRootUi, defineContentScript, useState } from "#imports";

import "~/assets/styles/globals.css";
import { Message, sendMessage } from "@/lib/messaging";
import { useSettingsStore } from "@/lib/store/settings.store";
import { useSessionStore } from "@/lib/store/session.store";

const ContentScriptUI = () => {
  const { session, setSession } = useSessionStore();
  const { settings, setSettings } = useSettingsStore();

  function startChatMonitoring() {
    setSession({ ...session, isMonitoring: true });
    const newChatObserver = new MutationObserver((mutations) => {
      mutations.forEach(async (mutation) => {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          const div = mutation.addedNodes[0] as HTMLDivElement;
          const messageContainer = div.querySelector(
            "div.html-div"
          ) as HTMLDivElement;
          if (!messageContainer) {
            return;
          }
          const parent = messageContainer?.parentElement;

          const messageLine = parent?.childNodes[1];
          if (!messageLine) {
            return;
          }
          if (messageLine.childNodes.length <= 1) {
            return;
          }
          if (
            messageLine &&
            messageLine?.previousSibling?.textContent == "You sent"
          ) {
            return;
          }
          const receivedMessage = messageLine.childNodes[1]?.textContent;
          console.log("receivedMessage", receivedMessage);
          return sendMessage(Message.ADD_LOG, receivedMessage ?? "");
        }
      });
    });
    newChatObserver.observe(
      document.querySelector(
        `div[aria-label='Messages in conversation titled ${session.conversationName}']`
      ) as Node,
      {
        childList: true,
        subtree: true,
      }
    );
    setSession({
      ...session,
      isMonitoring: true,
      chatObserver: newChatObserver,
    });
  }

  function stopChatMonitoring() {
    session.chatObserver?.disconnect();
    setSession({
      ...session,
      isMonitoring: false,
      chatObserver: null,
    });
  }

  function downloadImage(imageUrl: string) {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = "screenshot.png";
    a.click();
  }

  async function sendImageToServer(imageUrl: string) {
    const response = (await chrome.runtime.sendMessage({
      action: "takeScreenshot",
      imageUrl,
    })) as { data: { content: string; timeReceived: string } };
  }

  async function takeAndSendScreenshot(sendToServer: boolean = true) {
    if (!session.stream || !session.isPermissionGranted) {
      await requestDisplayPermission();
    }

    const track = session.stream?.getVideoTracks()[0];
    if (!track) {
      alert("No video tracks found");
      return;
    }

    // @ts-ignore
    const imageCapture = new ImageCapture(track);
    const bitmap = await imageCapture.grabFrame();
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d");
    context?.drawImage(bitmap, 0, 0);
    const screenshot = canvas.toDataURL();
    const croppedImage = await cropImage(screenshot);
    if (sendToServer) {
      await sendImageToServer(croppedImage);
    } else {
      downloadImage(croppedImage);
    }
  }

  function cropImage(imageUrl: string): Promise<string> {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        // Crop 300px from each side (left and right) to estimate the size of the video call window in portrait mode
        const horizontalCrop = settings.widthCropping;
        canvas.width = image.width - horizontalCrop * 2;
        // Reduce height by 200px to account for the bottom bottom bar and the url bar
        canvas.height = image.height - settings.verticalCropping * 2;
        const context = canvas.getContext("2d");
        if (context) {
          context.drawImage(
            image,
            -settings.widthCropping,
            -settings.verticalCropping
          );
          const croppedImage = canvas.toDataURL(
            "image/jpeg",
            settings.imageQuality
          );
          resolve(croppedImage);
        }
      };
      image.src = imageUrl;
    });
  }

  async function requestDisplayPermission() {
    const stream = await navigator.mediaDevices
      .getDisplayMedia({
        video: true,
        audio: false,
      })
      .catch((err) => {
        setSession({ ...session, isPermissionGranted: false });
        console.error("Error requesting display permission", err);
        return null;
      });
    if (stream) {
      setSession({
        ...session,
        isPermissionGranted: true,
        stream: stream,
      });
    }
  }

  return (
    <div className="flex flex-row gap-2">
      <Button
        onClick={() =>
          session.isMonitoring ? stopChatMonitoring() : startChatMonitoring()
        }
      >
        {session.isMonitoring
          ? "Stop Chat Monitoring"
          : "Start Chat Monitoring"}
      </Button>
      <Button onClick={() => takeAndSendScreenshot(false)}>
        Take and Send Screenshot
      </Button>
      <Button onClick={() => requestDisplayPermission()}>
        {session.isPermissionGranted
          ? "Permissions Granted"
          : "Request Display Permission"}
      </Button>
    </div>
  );
};

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",

  async main(ctx) {
    console.log(
      "Content script is running! Edit `src/app/content` and save to reload."
    );

    const ui = await createShadowRootUi(ctx, {
      name: "extro-ui",
      position: "overlay",
      anchor: "body",
      onMount: (container) => {
        const app = document.createElement("div");
        container.append(app);

        const root = ReactDOM.createRoot(app);
        root.render(<ContentScriptUI />);
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });

    ui.mount();
  },
});
