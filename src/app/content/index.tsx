import { createShadowRootUi, defineContentScript } from "#imports";
import ReactDOM from "react-dom/client";

import {
  MESSENGER_CALL_URL,
  MESSENGER_CONVERSATION_URL,
} from "@/lib/constants";
import "~/assets/styles/globals.css";
import { CallScreenView } from "./call-screen-view";
import { ConversionScreenView } from "./conversion-screen-view";

const ContentScriptUI = () => {
  const onTheCallScreen = document.location.href.includes(MESSENGER_CALL_URL);
  const onTheConversationScreen = document.location.href.includes(
    MESSENGER_CONVERSATION_URL
  );

  return (
    <div className="fixed bottom-0 flex flex-col gap-4 p-4">
      {onTheConversationScreen && <ConversionScreenView />}
      {onTheCallScreen && <CallScreenView />}
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
