import { defineBackground } from "#imports";
import { aiTtsRequest, aiVisionRequest, generateAiText } from "@/lib/ai";
import { getStorage, StorageKey } from "@/lib/storage";
import { logError, logMessage } from "@/lib/utils";
import { Log, Message, onMessage } from "~/lib/messaging";

const main = () => {
  console.log(
    "Background service worker is running! Edit `src/app/background` and save to reload."
  );
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("popup.html"),
  });
});

onMessage(Message.ADD_LOG, async (message) => {
  try {
    logMessage("[background] Add Log: " + message.data);
    const storage = getStorage(StorageKey.LOGS);
    const logs = await storage.getValue();
    const newLog = new Log(message.data, Date.now());
    logs.push(newLog);
    await storage.setValue(logs);
    return;
  } catch (error) {
    logError("[background] Error adding log: " + error);
  }
});

onMessage(Message.AI_CHAT, async (message) => {
  console.log("[background] AI Chat Request Received", message.data);
  try {
    logMessage("[background] AI Chat Request Received");
    const response = await generateAiText(message.data);
    logMessage("[background] AI Chat Response Generated: " + response);
    return response;
  } catch (error: unknown) {
    logError("[background] AI Chat Error: " + error);
    throw error;
  }
});

onMessage(Message.AI_TTS, async (message) => {
  logMessage("[background] AI TTS Request Received");
  const base64Audio = await aiTtsRequest(message.data);
  logMessage(
    "[background] AI TTS Response Generated: Length " + base64Audio.length
  );
  return base64Audio;
});

onMessage(Message.AI_VISION, async (message) => {
  logMessage("[background] AI Vision Request Received");
  let imageBlob: Blob;
  if (message.data.base64) {
    imageBlob = await fetch(message.data.base64).then((res) => res.blob());
  } else if (message.data.url) {
    imageBlob = await fetch(message.data.url).then((res) => res.blob());
  } else {
    logError("[background] No image data provided");
    throw new Error("No image data provided");
  }
  const response = await aiVisionRequest(imageBlob);
  logMessage("[background] AI Vision Response Generated: " + response);
  return response;
});

export default defineBackground(main);
