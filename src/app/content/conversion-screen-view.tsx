import { useCallback, useEffect, useRef } from "#imports";
import {
  providerToTTSModels,
  providerToTitle,
  toolTips,
} from "@/lib/constants";
import { Message, sendMessage } from "@/lib/messaging";
import { useSessionStore } from "@/lib/store/session.store";
import { useSettingsStore } from "@/lib/store/settings.store";
import { logMessage } from "@/lib/utils";
import { MessageCircle, MessageCircleX } from "lucide-react";
import { ChatModelSettings } from "./components/chat-model-settings";
import { ChatProviderSettings } from "./components/chat-provider-settings";
import { SettingHeader } from "./components/setting-header";

export function ConversionScreenView() {
  const { session, setSession } = useSessionStore();
  const { settings, setSettings } = useSettingsStore();

  const threadList = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    hideConversationThreadList();
  }, []);

  function hideConversationThreadList() {
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

  useEffect(() => {
    if (session.isMonitoring) {
      refreshChatObserver();
    }
  }, [settings.provider, settings.model, settings.useTTS]);

  function refreshChatObserver() {
    session.chatObserver?.disconnect();
    session.chatObserver = observeChat();
    setSession({
      ...session,
      chatObserver: session.chatObserver,
    });
  }

  function getNewMessageLine(mutation: MutationRecord) {
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
    return messageLine;
  }

  function messageHasImage(messageLine: HTMLDivElement) {
    const imageUrl =
      (messageLine.querySelector("img[alt='Open photo']") as HTMLImageElement)
        ?.src ?? "";
    return imageUrl;
  }

  const handleTts = useCallback(
    async (aiResponse: string) => {
      logMessage("Sending TTS request");
      const ttsResponse = await sendMessage(Message.AI_TTS, aiResponse);
      logMessage("TTS Response received. Sending to user.");
      sendAudioToUser(ttsResponse);
    },
    [sendAudioToUser]
  );

  const handleNewTextMessage = useCallback(
    async (receivedMessage: string) => {
      logMessage("User sent: " + receivedMessage);
      const aiResponse = await sendMessage(Message.AI_CHAT, receivedMessage);
      sendMessageToUser(aiResponse);
      if (settings.useTTS) {
        handleTts(aiResponse);
      }
    },
    [sendMessage, sendMessageToUser, settings.useTTS, handleTts]
  );

  function sendMessageToUser(aiResponse: string) {
    enterMessage(aiResponse);

    setTimeout(() => {
      logMessage(
        `Provider: ${settings.provider} | Model: ${
          settings.model[settings.provider]
        } | Message received: ${aiResponse}`
      );
      sendMessageViaInput();
    }, 200);
  }

  function sendAudioToUser(ttsResponse: string) {
    attachAudio(ttsResponse);
    setTimeout(() => {
      logMessage("Sending TTS response to user");
      sendMessageViaInput();
    }, 200);
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

  function observeChat(): MutationObserver {
    const newChatObserver = new MutationObserver((mutations) => {
      mutations.forEach(async (mutation) => {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          const messageLine = getNewMessageLine(mutation);
          if (!messageLine || messageLine.dataset.processed) {
            return;
          }
          messageLine.dataset.processed = "true";
          if (messageHasImage(messageLine)) {
            const imageUrl = messageHasImage(messageLine);
            sendReceivedImageToServer(imageUrl);
            return logMessage(`Image received: ${imageUrl}`);
          }
          const receivedMessage = messageLine.childNodes[1]?.textContent;
          if (receivedMessage && typeof receivedMessage === "string") {
            handleNewTextMessage(receivedMessage);
          }
          return logMessage(`Message received: ${receivedMessage ?? ""}`);
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

  const sendReceivedImageToServer = useCallback(
    async (imageUrl: string) => {
      const response = await sendMessage(Message.AI_VISION, {
        url: imageUrl,
      });
      enterMessage(response);
      setTimeout(() => {
        sendMessageViaInput();
      }, 200);
    },
    [enterMessage, sendMessageViaInput]
  );

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

  const conversationNameSettings = (
    <div className="fixed m-4 right-0 top-0 flex w-[200px] flex-col gap-2 bg-black p-2 rounded-md">
      <SettingHeader
        title="Conversation Name"
        tooltipText={toolTips.conversationName}
      />
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

  const ttsSettings = (
    <div className="w-auto flex flex-col gap-2 items-start">
      <div className="flex flex-row gap-2 items-center justify-between w-full">
        <SettingHeader title="TTS Model" tooltipText={toolTips.ttsModel} />
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

  const monitoringButton = (
    <button
      className="flex items-center cursor-pointer h-12 gap-2 rounded-md bg-black p-2 text-white drop-shadow-md font-sans"
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

  return (
    <div className="flex flex-col gap-2 w-full items-start justify-start">
      {conversationNameSettings}
      {monitoringButton}
      <div className="flex flex-col gap-2 bg-black p-2 rounded-md drop-shadow-md">
        <h1 className="text-xs font-bold text-white font-sans">Settings</h1>
        <div className="flex flex-row w-full h-16 gap-2">
          <ChatProviderSettings darkMode={true} />
          <ChatModelSettings darkMode={true} />
          {ttsSettings}
        </div>
      </div>
    </div>
  );
}
