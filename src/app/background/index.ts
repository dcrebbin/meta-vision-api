import { StorageKey, getStorage } from "@/lib/storage";
import { Log, Message, onMessage, sendMessage } from "~/lib/messaging";
import { defineBackground } from "#imports";

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

async function openAiTtsRequest(message: string) {
  const storageApiKey = getStorage(StorageKey.OPENAI_API_KEY);
  const OPENAI_API_KEY = await storageApiKey.getValue();

  return fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    body: JSON.stringify({
      model: "tts-1",
      input: message,
      voice: "alloy",
    }),
    headers: {
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
  });
}

async function perplexityRequest(message: string) {
  const storageApiKey = getStorage(StorageKey.PERPLEXITY_API_KEY);
  const PERPLEXITY_API_KEY = await storageApiKey.getValue();
  const storageModel = getStorage(StorageKey.PERPLEXITY_MODEL);
  const PERPLEXITY_MODEL = await storageModel.getValue();

  return fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    body: JSON.stringify({
      model: PERPLEXITY_MODEL,
      messages: [{ role: "user", content: message }],
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
    },
  });
}

async function openAiRequest(message: string) {
  const storageApiKey = getStorage(StorageKey.OPENAI_API_KEY);
  const OPENAI_API_KEY = await storageApiKey.getValue();
  const storageModel = getStorage(StorageKey.OPENAI_MODEL);
  const OPENAI_MODEL = await storageModel.getValue();

  console.log("OPENAI_API_KEY", OPENAI_API_KEY);
  console.log("OPENAI_MODEL", OPENAI_MODEL);

  return fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: message }],
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
  });
}

onMessage(Message.OPEN_AI, async (message) => {
  try {
    const response = await openAiRequest(message.data);
    if (!response.ok) {
      return `HTTP error! status: ${response.status}`;
    }
    const text = (await response.json()) as {
      choices: { message: { content: string } }[];
    };
    const messageContent = text.choices[0]?.message?.content;
    return messageContent ?? "Error: No message content";
  } catch (error) {
    console.error("Error:", error);
    return "Error: " + error;
  }
});

export default defineBackground(main);
