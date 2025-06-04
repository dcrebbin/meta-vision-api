import { Button } from "@/components/ui/button";
import ReactDOM from "react-dom/client";
import { browser } from "wxt/browser";
import { createShadowRootUi, defineContentScript, useState } from "#imports";

import "~/assets/styles/globals.css";
import { Message, sendMessage } from "@/lib/messaging";

const ContentScriptUI = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [chatObserver, setChatObserver] = useState<MutationObserver | null>(
    null
  );
  const conversationName: string = "ChatGPT";

  function startChatMonitoring() {
    setIsMonitoring(true);
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
        `div[aria-label='Messages in conversation titled ${conversationName}']`
      ) as Node,
      {
        childList: true,
        subtree: true,
      }
    );
    setChatObserver(newChatObserver);
  }

  function stopChatMonitoring() {
    chatObserver?.disconnect();
    setChatObserver(null);
    setIsMonitoring(false);
  }

  return (
    <div>
      <Button
        onClick={() =>
          isMonitoring ? stopChatMonitoring() : startChatMonitoring()
        }
      >
        {isMonitoring ? "Stop Chat Monitoring" : "Start Chat Monitoring"}
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
