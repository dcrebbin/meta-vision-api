import { defineBackground } from "#imports";
import { aiTtsRequest, aiVisionRequest, generateAiText } from "@/lib/ai";
import { logErrorToConsole, logMessageToConsole } from "@/lib/utils";
import { Message, onMessage } from "~/lib/messaging";

const main = () => {
  console.log(
    "Background service worker is running! Edit `src/app/background` and save to reload."
  );
};

onMessage(Message.AI_CHAT, async (message) => {
  try {
    logMessageToConsole("[background] AI Chat Request Received");
    const response = await generateAiText(message.data);
    logMessageToConsole("[background] AI Chat Response Generated: " + response);
    return response;
  } catch (error) {
    console.error("Error:", error);
    return "Error: " + error;
  }
});

onMessage(Message.AI_TTS, async (message) => {
  logMessageToConsole("[background] AI TTS Request Received");
  const base64Audio = await aiTtsRequest(message.data);
  logMessageToConsole(
    "[background] AI TTS Response Generated: Length " + base64Audio.length
  );
  return base64Audio;
});

onMessage(Message.AI_VISION, async (message) => {
  logMessageToConsole("[background] AI Vision Request Received");
  let imageBlob: Blob;
  if (message.data.base64) {
    imageBlob = await fetch(message.data.base64).then((res) => res.blob());
  } else if (message.data.url) {
    imageBlob = await fetch(message.data.url).then((res) => res.blob());
  } else {
    logErrorToConsole("No image data provided");
    return "Error: No image data provided";
  }
  const response = await aiVisionRequest(imageBlob);
  logMessageToConsole("[background] AI Vision Response Generated: " + response);
  return response;
});

export default defineBackground(main);
