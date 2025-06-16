import { useCallback, useEffect, useRef, useState } from "#imports";
import {
  providerInformation,
  providerToTTSModels,
  toolTips,
} from "@/lib/constants";
import { Message, sendMessage } from "@/lib/messaging";
import { useSessionStore } from "@/lib/store/session.store";
import { useSettingsStore } from "@/lib/store/settings.store";
import { logError, logMessage } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { ChatModelSettings } from "./components/chat-model-settings";
import { ChatProviderSettings } from "./components/chat-provider-settings";
import { SystemPromptSettings } from "./components/system-prompt-settings";
import { SettingHeader } from "./components/setting-header";

export function ConversionScreenView() {
  const { session, setSession } = useSessionStore();
  const { settings, setSettings } = useSettingsStore();

  const threadList = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const selector = "div[aria-label='Thread list']";

    const applyVisibility = () => {
      const threadListElement = document.querySelector(
        selector
      ) as HTMLDivElement;
      if (threadListElement) {
        threadList.current = threadListElement;
        threadListElement.style.display = settings.isConversationSidebarVisible
          ? "block"
          : "none";
      }
    };

    applyVisibility();

    const observer = new MutationObserver(() => {
      applyVisibility();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [settings.isConversationSidebarVisible]);

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
    if (!mutation.addedNodes || mutation.addedNodes.length === 0) return;
    const div = mutation.addedNodes[0];
    if (!(div instanceof HTMLDivElement)) return;
    const divParent = div.parentElement;
    if (!divParent) return;
    const children = Array.from(divParent.childNodes);
    if (children[children.length - 1] !== div) return;

    const messageContainer = div.querySelector(
      "div.html-div"
    ) as HTMLDivElement | null;
    if (!messageContainer) return;
    const parent = messageContainer.parentElement;
    if (!parent) return;

    const messageLine = parent.childNodes[1] as HTMLDivElement | undefined;
    if (!messageLine || (messageLine as any).dataset?.processed) return;
    if (messageLine.childNodes.length <= 1) return;
    if (
      messageLine.previousSibling &&
      messageLine.previousSibling.textContent === "You sent"
    )
      return;

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

  async function handleNewTextMessage(receivedMessage: string) {
    logMessage("User sent: " + receivedMessage);
    try {
      const aiResponse = await sendMessage(Message.AI_CHAT, receivedMessage);
      sendMessageToUser(aiResponse);
      if (settings.useTTS) {
        handleTts(aiResponse);
      }
    } catch (error: unknown) {
      logError("Error sending message to user: " + error);
      alert(error);
    }
  }

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
          if (!messageLine) {
            return;
          }

          if (messageHasImage(messageLine)) {
            try {
              const imageUrl = messageHasImage(messageLine);
              sendReceivedImageToServer(imageUrl);
              return logMessage(`Image received: ${imageUrl}`);
            } catch (error) {
              logError("Error sending image to server: " + error);
              alert(error);
              return;
            }
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
        `div[aria-label*='Messages in conversation titled']`
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

  const ttsSettings = (
    <div className="w-auto flex flex-col gap-2 items-start">
      <div className="flex flex-row gap-2 items-center justify-between w-full">
        <SettingHeader
          title="TTS Model"
          tooltipText={toolTips.ttsModel}
          darkMode={true}
        />
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
            {
              providerToTTSModels[ttsModel as keyof typeof providerToTTSModels]
                .title
            }
            {providerToTTSModels[ttsModel as keyof typeof providerToTTSModels]
              .provider &&
            providerInformation[
              providerToTTSModels[ttsModel as keyof typeof providerToTTSModels]
                .provider as keyof typeof providerInformation
            ]
              ? ` (${
                  providerInformation[
                    providerToTTSModels[
                      ttsModel as keyof typeof providerToTTSModels
                    ].provider as keyof typeof providerInformation
                  ].title
                })`
              : ""}
          </option>
        ))}
      </select>
    </div>
  );

  function isAtBottom() {
    const conversation = document.querySelector(
      `div[aria-label*='Messages in conversation titled']`
    ) as HTMLDivElement;
    if (!conversation) {
      return false;
    }
    const scrollContent = conversation.firstChild?.firstChild as HTMLDivElement;
    if (!scrollContent) {
      return false;
    }
    return scrollContent.scrollHeight === scrollContent.scrollTop;
  }

  function scrollToBottom() {
    const conversation = document.querySelector(
      `div[aria-label*='Messages in conversation titled']`
    ) as HTMLDivElement;
    if (conversation) {
      const scrollContent = conversation.firstChild
        ?.firstChild as HTMLDivElement;
      if (!scrollContent) {
        return false;
      }
      if (scrollContent.scrollHeight === scrollContent.scrollTop) {
        return true;
      }
      scrollContent.scrollTo({
        top: scrollContent.scrollHeight,
        behavior: "instant",
      });
      return true;
    }
    return false;
  }

  let userScrolling = false;

  useEffect(() => {
    if (!session.isMonitoring) {
      return;
    }
    const conversation = document.querySelector(
      `div[aria-label*='Messages in conversation titled']`
    ) as HTMLDivElement;
    if (conversation) {
      const scrollContent = conversation.firstChild
        ?.firstChild as HTMLDivElement;

      scrollContent.addEventListener("wheel", () => (userScrolling = true), {
        passive: true,
      });
      scrollContent.addEventListener(
        "touchstart",
        () => (userScrolling = true),
        { passive: true }
      );
      scrollContent.addEventListener("keydown", () => (userScrolling = true), {
        passive: true,
      });

      scrollContent.addEventListener("scroll", () => {
        if (userScrolling) {
          stopChatMonitoring();
          userScrolling = false;
        } else {
          // Programmatic scroll
          console.log("programmatic scroll");
        }
      });
      return () => {
        scrollContent.removeEventListener(
          "wheel",
          () => (userScrolling = true)
        );
        scrollContent.removeEventListener(
          "touchstart",
          () => (userScrolling = true)
        );
      };
    }
  }, [session.isMonitoring]);

  async function startChatMonitoring() {
    if (!isAtBottom()) {
      scrollToBottom();
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
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

  function useEllipsisAnimation(isActive: boolean) {
    const [dots, setDots] = useState("");
    useEffect(() => {
      if (!isActive) {
        setDots("");
        return;
      }
      let count = 0;
      const interval = setInterval(() => {
        count = (count + 1) % 4;
        setDots(".".repeat(count));
      }, 400);
      return () => clearInterval(interval);
    }, [isActive]);
    return dots;
  }

  function MonitoringButton() {
    const animatedDots = useEllipsisAnimation(session.isMonitoring);
    return (
      <button
        className={`flex items-center cursor-pointer h-12 gap-2 rounded-md bg-black p-2 text-white drop-shadow-md font-sans ${
          settings.isMaiUIVisible ? "block" : "hidden"
        }`}
        onClick={() =>
          session.isMonitoring ? stopChatMonitoring() : startChatMonitoring()
        }
      >
        {session.isMonitoring ? (
          <span className="inline-block text-xs w-38 font-bold text-left">
            Stop Monitoring Chat{animatedDots}
          </span>
        ) : (
          <span className="inline-block text-xs w-38 font-bold text-left">
            Start Monitoring Chat
          </span>
        )}
      </button>
    );
  }

  const monitoringButton = <MonitoringButton />;

  function toggleConversationSidebar() {
    const threadListElement = document.querySelector(
      "div[aria-label='Thread list']"
    ) as HTMLDivElement;

    if (threadListElement) {
      threadListElement.style.display =
        threadListElement.style.display === "none" ? "block" : "none";
    }
    setSettings({
      ...settings,
      isConversationSidebarVisible: !settings.isConversationSidebarVisible,
    });
  }

  const toggleConversationSidebarButton = (
    <button
      className={`flex items-center justify-baseline cursor-pointer h-12 gap-2 rounded-md bg-black p-2 text-white drop-shadow-md font-sans ${
        settings.isMaiUIVisible ? "block" : "hidden"
      }`}
      onClick={() => toggleConversationSidebar()}
    >
      <span className="text-xs font-bold w-26">
        {settings.isConversationSidebarVisible
          ? "Hide Sidebar"
          : "Show Sidebar"}
      </span>
      {settings.isConversationSidebarVisible ? <Eye /> : <EyeOff />}
    </button>
  );

  const toggleMaiUIButton = (
    <button
      className="flex items-center justify-baseline cursor-pointer h-12 gap-2 rounded-md bg-black p-2 text-white drop-shadow-md font-sans"
      onClick={() => toggleMaiUI()}
    >
      <span className="text-xs font-bold w-26">
        {settings.isMaiUIVisible ? "Hide Mai UI" : "Show Mai UI"}
      </span>
      {settings.isMaiUIVisible ? <Eye /> : <EyeOff />}
    </button>
  );

  function toggleMaiUI() {
    setSettings({
      ...settings,
      isMaiUIVisible: !settings.isMaiUIVisible,
    });
  }
  return (
    <div className="flex flex-col gap-2 w-full items-start justify-start">
      <div className="flex flex-row gap-2">
        {monitoringButton}
        {toggleConversationSidebarButton}
        {toggleMaiUIButton}
      </div>
      <div
        className={`flex flex-col gap-2 bg-black p-2 rounded-md drop-shadow-md ${
          settings.isMaiUIVisible ? "block" : "hidden"
        }`}
      >
        <h1 className="text-xs font-bold text-white font-sans">AI Settings</h1>
        <div className="flex flex-row w-full h-16 gap-2">
          <ChatProviderSettings darkMode={true} />
          <ChatModelSettings darkMode={true} />
          <SystemPromptSettings darkMode={true} />
          {ttsSettings}
        </div>
      </div>
    </div>
  );
}
