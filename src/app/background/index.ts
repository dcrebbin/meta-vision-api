import { defineBackground } from "#imports";
import { openAiRequest, openAiTtsRequest, openAiVisionRequest } from "@/lib/ai";
import { Log, Message, onMessage, sendMessage } from "~/lib/messaging";

const main = () => {
  console.log(
    "Background service worker is running! Edit `src/app/background` and save to reload."
  );
};

onMessage(Message.ADD_LOG, (message) => {
  console.log("Add Log", message);
  sendMessage(Message.RECEIVE_LOG, new Log(message.data, message.timestamp));
  return;
});

onMessage(Message.AI_CHAT, async (message) => {
  try {
    const response = await openAiRequest(message.data);
    return response;
  } catch (error) {
    console.error("Error:", error);
    return "Error: " + error;
  }
});

onMessage(Message.AI_TTS, async (message) => {
  const base64Audio = await openAiTtsRequest(message.data);
  return base64Audio;
});

onMessage(Message.AI_VISION, async (message) => {
  let imageBlob: Blob;
  if (message.data.base64) {
    imageBlob = await fetch(message.data.base64).then((res) => res.blob());
  } else if (message.data.url) {
    imageBlob = await fetch(message.data.url).then((res) => res.blob());
  } else {
    return "Error: No image data provided";
  }
  const response = await openAiVisionRequest(imageBlob);
  return response;
});

export default defineBackground(main);
