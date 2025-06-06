import {
  createShadowRootUi,
  defineContentScript,
  useEffect,
  useRef,
} from "#imports";
import ReactDOM from "react-dom/client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  aiChatProviders,
  providerToModels,
  providerToTitle,
  providerToTTSModels,
} from "@/lib/constants";
import { Message, sendMessage } from "@/lib/messaging";
import { useSessionStore } from "@/lib/store/session.store";
import { useSettingsStore } from "@/lib/store/settings.store";
import { Check, Info, MessageCircle, MessageCircleX } from "lucide-react";
import "~/assets/styles/globals.css";

const ContentScriptUI = () => {
  const { session, setSession } = useSessionStore();
  const { settings, setSettings } = useSettingsStore();
  const onTheCallScreen = document.location.href.includes("groupcall/ROOM");
  const onTheConversationScreen =
    document.location.href.includes("messages/t/");

  const threadList = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (onTheConversationScreen) {
      const findAndHideThreadList = () => {
        const threadListElement = document.querySelector(
          "div[aria-label='Thread list']"
        ) as HTMLDivElement;

        if (threadListElement) {
          threadList.current = threadListElement;
          threadList.current.style.display = "none";
        }
      };
      findAndHideThreadList();
      const observer = new MutationObserver(() => {
        findAndHideThreadList();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      return () => {
        observer.disconnect();
        if (threadList.current) {
          threadList.current.style.display = "block";
        }
      };
    }
  }, [onTheConversationScreen]);

  const toolTips = {
    chatProvider: "The AI provider to use for chat or vision LLM responses.",
    chatModel:
      "The model to use for chat or vision LLM responses specific to selected provider.",
    ttsModel: "The model to use for text to speech if TTS is enabled.",
    conversationName:
      "The name of the conversation. Used to identify the conversation in the chat history via the DOM.",
    takeAndSendScreenshot:
      "Takes a screenshot of the current screen and sends it to the server for processing.",
    requestDisplayPermission:
      "Requests permission to access the display. This is required to take screenshots of the current screen.",
  };

  useEffect(() => {
    if (session.isMonitoring) {
      refreshChatObserver();
    }
  }, [settings.provider, settings.model, settings.useTTS]);

  const chatProviderTooltip = (
    tooltipText: string,
    darkMode: boolean = false
  ) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Info
            className={`w-4 h-4 cursor-pointer ${
              darkMode ? "text-black" : "text-white"
            }`}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const settingHeader = (
    title: string,
    tooltipText: string,
    darkMode: boolean = false
  ) => (
    <div className="flex flex-row gap-2 items-center justify-between w-fit">
      <p
        className={`text-xs font-bold font-sans flex flex-row gap-2 items-center ${
          darkMode ? "text-black" : "text-white"
        }`}
      >
        {title}
      </p>
      {chatProviderTooltip(tooltipText, darkMode)}
    </div>
  );

  function observeChat(): MutationObserver {
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

          const messageLine = parent?.childNodes[1] as HTMLDivElement;
          if (!messageLine || messageLine.dataset.processed) {
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
          messageLine.dataset.processed = "true";
          const receivedMessage = messageLine.childNodes[1]?.textContent;
          const messageIsAnImage = messageLine.querySelector(
            "img[alt='Open photo']"
          );
          if (messageIsAnImage) {
            const imageUrl = (messageIsAnImage as HTMLImageElement).src;
            if (imageUrl) {
              sendReceivedImageToServer(imageUrl);
              return;
            }
            return;
          }
          if (receivedMessage && typeof receivedMessage === "string") {
            sendMessage(Message.ADD_LOG, "Sending chat request");
            sendMessage(Message.ADD_LOG, "TTS enabled: " + settings.useTTS);

            console.log("settings", settings);

            const aiResponse = await sendMessage(
              Message.AI_CHAT,
              receivedMessage
            );
            sendMessage(Message.ADD_LOG, aiResponse);
            enterMessage(aiResponse);
            void setTimeout(() => {
              sendMessage(
                Message.ADD_LOG,
                `Provider: ${settings.provider} | Model: ${settings.model.get(
                  settings.provider
                )} | Message received: ${receivedMessage}`
              );
              sendMessageViaInput();
            }, 200);
            if (settings.useTTS) {
              sendMessage(Message.ADD_LOG, "Sending TTS request");
              const ttsResponse = await sendMessage(Message.AI_TTS, aiResponse);
              sendMessage(Message.ADD_LOG, "TTS Response received: ");
              attachAudio(ttsResponse);
              setTimeout(() => {
                sendMessage(Message.ADD_LOG, "Sending TTS response to user");
                sendMessageViaInput();
              }, 200);
            }
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
    return newChatObserver;
  }

  function startChatMonitoring() {
    setSession({ ...session, isMonitoring: true });
    const newChatObserver = observeChat();
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

  async function sendImage(base64Image: string) {
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    if (!fileInput) {
      return;
    }
    const binaryStr = atob(base64Image);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: "image/png" });
    const file = new File([blob], "screenshot.png", { type: "image/png" });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;

    const event = new Event("change", { bubbles: true });
    fileInput.dispatchEvent(event);
  }

  function downloadImage(imageUrl: string) {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = "screenshot.png";
    a.click();
  }

  async function sendReceivedImageToServer(imageUrl: string) {
    const response = await sendMessage(Message.AI_VISION, {
      url: imageUrl,
    });
    enterMessage(response);
    setTimeout(() => {
      sendMessageViaInput();
    }, 200);
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

    // @ts-expect-error - ImageCapture is not defined in the browser
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

  async function sendImageToServer(base64Image: string) {
    const response = await sendMessage(Message.AI_VISION, {
      base64: base64Image,
    });
    sendMessage(Message.ADD_LOG, response);
  }

  function cropImage(imageUrl: string): Promise<string> {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const horizontalCrop = settings.widthCropping;
        canvas.width = image.width - horizontalCrop * 2;
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

  function attachAudio(base64Audio: string) {
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    if (!fileInput) {
      return;
    }
    const binaryStr = atob(base64Audio);
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

  function refreshChatObserver() {
    session.chatObserver?.disconnect();
    session.chatObserver = observeChat();
    setSession({
      ...session,
      chatObserver: session.chatObserver,
    });
  }

  const ttsSettings = (
    <div className="w-auto flex flex-col gap-2 items-start">
      <div className="flex flex-row gap-2 items-center justify-between w-full">
        {settingHeader("TTS Model", toolTips.ttsModel)}
        <div className="w-[1px] h-4 bg-white" />
        <p className="text-xs font-bold text-white w-14 font-sans">Use TTS</p>
        <input
          className="cursor-pointer"
          type="checkbox"
          checked={settings.useTTS}
          onChange={(e) => {
            setSettings({
              ...settings,
              useTTS: e.target.checked,
            });
          }}
        />
      </div>
      <select
        disabled={!settings.useTTS}
        className="cursor-pointer disabled:cursor-not-allowed rounded-md p-2 h-fit bg-gray-800 drop-shadow-md text-white font-sans disabled:opacity-50"
        value={settings.ttsModel ?? "tts-1"}
        onChange={(e) => {
          setSettings({
            ...settings,
            ttsModel: e.target.value,
          });
        }}
      >
        {Object.keys(providerToTTSModels).map((ttsModel) => (
          <option key={ttsModel} value={ttsModel}>
            {`${
              providerToTTSModels[ttsModel as keyof typeof providerToTTSModels]
                .title
            } (${
              providerToTitle[
                providerToTTSModels[
                  ttsModel as keyof typeof providerToTTSModels
                ].provider as keyof typeof providerToTitle
              ]
            } )`}
          </option>
        ))}
      </select>
    </div>
  );

  const chatProviderSettings = (darkMode: boolean = false) => (
    <div className="w-auto flex flex-col gap-2 items-start rounded-md">
      {settingHeader("Provider", toolTips.chatProvider, darkMode)}
      <select
        className="cursor-pointer rounded-md h-fit p-2 bg-gray-800 drop-shadow-md text-white font-sans"
        value={settings.provider ?? "openai"}
        onChange={(e) => {
          setSettings({
            ...settings,
            provider: e.target.value as
              | "openai"
              | "anthropic"
              | "perplexity"
              | "google",
          });
        }}
      >
        {aiChatProviders.map((provider) => (
          <option key={provider} value={provider}>
            {providerToTitle[provider as keyof typeof providerToTitle]}
          </option>
        ))}
      </select>
    </div>
  );

  const chatModelSettings = (darkMode: boolean = false) => (
    <div className="w-auto flex flex-col gap-2 items-start">
      {settingHeader("Model", toolTips.chatModel, darkMode)}

      <select
        className="cursor-pointer rounded-md h-auto p-2 bg-gray-800 drop-shadow-md text-white font-sans"
        value={settings.model.get(settings.provider) ?? "gpt-4o-mini"}
        onChange={(e) => {
          setSettings({
            ...settings,
            model: new Map([[settings.provider, e.target.value]]),
          });
        }}
      >
        {providerToModels[
          settings.provider as keyof typeof providerToModels
        ].map((model) => (
          <option key={model.value} value={model.value}>
            {model.title}
          </option>
        ))}
      </select>
    </div>
  );

  const conversationNameSettings = (
    <div className="fixed m-4 right-0 top-0 flex w-[200px] flex-col gap-2 bg-black p-2 rounded-md">
      {settingHeader("Conversation Name", toolTips.conversationName)}
      <input
        className="cursor-pointer rounded-md p-2 bg-gray-800 drop-shadow-md text-white font-sans"
        type="text"
        value={session.conversationName}
        onChange={(e) =>
          setSession({ ...session, conversationName: e.target.value })
        }
      />
    </div>
  );

  const monitoringButton = (
    <button
      className="flex items-center h-12 gap-2 rounded-md bg-black p-2 text-white drop-shadow-md font-sans"
      onClick={() =>
        session.isMonitoring ? stopChatMonitoring() : startChatMonitoring()
      }
    >
      <span className="text-xs font-bold w-36">
        {session.isMonitoring
          ? "Stop Monitoring Chat"
          : "Start Monitoring Chat"}
      </span>
      {session.isMonitoring ? <MessageCircleX /> : <MessageCircle />}
    </button>
  );

  function startVideoMonitoring() {
    setSession({
      ...session,
      isVideoMonitoring: true,
      videoMonitoringInterval: setInterval(() => {
        sendMessage(Message.ADD_LOG, "Sending screenshot to server");
        takeAndSendScreenshot(true);
      }, settings.videoCaptureInterval),
    });
  }

  function stopVideoMonitoring() {
    setSession({
      ...session,
      isVideoMonitoring: false,
      videoMonitoringInterval: null,
    });
    if (session.videoMonitoringInterval) {
      clearInterval(session.videoMonitoringInterval);
    }
  }

  return (
    <div className="fixed bottom-0 flex flex-col gap-4 p-4">
      {onTheConversationScreen && (
        <div className="flex flex-col gap-2 w-full items-start justify-start">
          {conversationNameSettings}
          {monitoringButton}
          <div className="flex flex-col gap-2 bg-black p-2 rounded-md drop-shadow-md">
            <h1 className="text-xs font-bold text-white font-sans">Settings</h1>
            <div className="flex flex-row w-full h-16 gap-2">
              {chatProviderSettings()}
              {chatModelSettings()}
              {ttsSettings}
            </div>
          </div>
        </div>
      )}
      {onTheCallScreen && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-row gap-2">
            <button
              className={`flex cursor-pointer items-center h-12 gap-2 rounded-md p-2 drop-shadow-md font-sans text-white ${
                session.isPermissionGranted ? "bg-green-500" : "bg-red-500"
              }`}
              onClick={() => requestDisplayPermission()}
            >
              {session.isPermissionGranted
                ? "Display Permissions Granted"
                : "Request Display Permissions"}
              {session.isPermissionGranted && <Check />}
            </button>
            <button
              disabled={!session.isPermissionGranted}
              className="flex cursor-pointer items-center h-12 gap-2 rounded-md bg-white p-2 text-black drop-shadow-md font-sans disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() =>
                session.isVideoMonitoring
                  ? stopVideoMonitoring()
                  : startVideoMonitoring()
              }
            >
              {session.isVideoMonitoring
                ? "Stop Monitoring Video"
                : "Start Monitoring Video"}
            </button>
            <button
              className="flex cursor-pointer items-center h-12 gap-2 rounded-md bg-white p-2 text-black drop-shadow-md font-sans disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => takeAndSendScreenshot(false)}
            >
              Take Screenshot
            </button>
          </div>
          <div className="flex flex-row gap-2 bg-white p-2 rounded-md drop-shadow-md">
            {chatProviderSettings(true)}
            {chatModelSettings(true)}
          </div>
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
