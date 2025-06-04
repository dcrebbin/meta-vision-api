import { createShadowRootUi, defineContentScript } from "#imports";
import { Button } from "@/components/ui/button";
import ReactDOM from "react-dom/client";

import { Message, sendMessage } from "@/lib/messaging";
import { useSessionStore } from "@/lib/store/session.store";
import { useSettingsStore } from "@/lib/store/settings.store";
import "~/assets/styles/globals.css";

const ContentScriptUI = () => {
  const { session, setSession } = useSessionStore();
  const { settings, setSettings } = useSettingsStore();
  const onTheCallScreen = document.location.href.includes("groupcall/ROOM");
  const onTheConversationScreen =
    document.location.href.includes("messages/t/");

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
          if (receivedMessage && typeof receivedMessage === "string") {
            const response = await sendMessage(
              Message.AI_CHAT,
              receivedMessage
            );
            console.log("response", response);
            enterMessage(response);
            setTimeout(() => {
              sendMessageViaInput();
            }, 200);
          }
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

  function attachAudio(audio: string) {
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    if (!fileInput) {
      return;
    }
    const binaryStr = atob(audio);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: "audio/mpeg" });
    const file = new File([blob], "audio.mp3", { type: "audio/mpeg" });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;

    const event = new Event("change", { bubbles: true });
    fileInput.dispatchEvent(event);
  }

  function sendMessageViaInput() {
    const messageInput = document.querySelector(
      "div[aria-label='Message']"
    ) as HTMLDivElement;
    const event = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "Enter",
    });
    messageInput.dispatchEvent(event);
  }

  function enterMessage(message: string) {
    const messageInput = document.querySelector("div[aria-label='Message']");
    if (!messageInput) {
      return;
    }

    messageInput.innerHTML = message;
    messageInput.dispatchEvent(new Event("focus"));
    messageInput.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        cancelable: true,
        data: message,
        inputType: "insertText",
      })
    );
  }

  return (
    <div className="flex font-mono h-[40px] flex-row gap-2 justify-end items-end px-4">
      {onTheConversationScreen && (
        <div className="flex flex-row gap-2 w-full items-center justify-center">
          <Button
            onClick={() =>
              session.isMonitoring
                ? stopChatMonitoring()
                : startChatMonitoring()
            }
          >
            {session.isMonitoring
              ? "Stop Chat Monitoring"
              : "Start Chat Monitoring"}
          </Button>
          <div className="flex w-[200px] flex-col gap-2 bg-black p-2 rounded-md">
            <p className="text-xs font-bold text-white">Conversation Name</p>
            <input
              className="rounded-md p-2 bg-gray-800 drop-shadow-md text-white"
              type="text"
              value={session.conversationName}
              onChange={(e) =>
                setSession({ ...session, conversationName: e.target.value })
              }
            />
          </div>
        </div>
      )}
      {onTheCallScreen && (
        <div className="flex flex-row gap-2">
          <Button onClick={() => takeAndSendScreenshot(false)}>
            Take and Send Screenshot
          </Button>
          <Button onClick={() => requestDisplayPermission()}>
            {session.isPermissionGranted
              ? "Permissions Granted"
              : "Request Display Permission"}
          </Button>
        </div>
      )}
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
