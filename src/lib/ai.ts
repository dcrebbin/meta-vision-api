import { getStorage, StorageKey } from "./storage";

export async function openAiTtsRequest(message: string) {
  const storageApiKey = getStorage(StorageKey.OPENAI_API_KEY);
  const OPENAI_API_KEY = await storageApiKey.getValue();

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
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

  const audioBlob = await response.blob();
  const base64Audio = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve(base64String.split(",")[1] ?? "");
    };
    reader.readAsDataURL(audioBlob);
  });

  return base64Audio;
}

export async function perplexityRequest(message: string) {
  const storageApiKey = getStorage(StorageKey.PERPLEXITY_API_KEY);
  const PERPLEXITY_API_KEY = await storageApiKey.getValue();
  const storageModel = getStorage(StorageKey.PERPLEXITY_MODEL);
  const PERPLEXITY_MODEL = await storageModel.getValue();

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
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

  const text = (await response.json()) as {
    choices: { message: { content: string } }[];
  };
  const messageContent = text.choices[0]?.message?.content;

  return messageContent ?? "Error: No message content";
}

export async function openAiRequest(message: string) {
  const storageApiKey = getStorage(StorageKey.OPENAI_API_KEY);
  const OPENAI_API_KEY = await storageApiKey.getValue();
  const storageModel = getStorage(StorageKey.OPENAI_MODEL);
  const OPENAI_MODEL = await storageModel.getValue();

  console.log("OPENAI_API_KEY", OPENAI_API_KEY);
  console.log("OPENAI_MODEL", OPENAI_MODEL);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
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

  const text = (await response.json()) as {
    choices: { message: { content: string } }[];
  };
  const messageContent = text.choices[0]?.message?.content;

  return messageContent ?? "Error: No message content";
}

export async function openAiVisionRequest(imageBlob: Blob) {
  const storageApiKey = getStorage(StorageKey.OPENAI_API_KEY);
  const OPENAI_API_KEY = await storageApiKey.getValue();

  const base64Image = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve(base64String.split(",")[1] ?? "");
    };
    reader.readAsDataURL(imageBlob);
  });

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe this image in detail",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
  });

  const text = (await response.json()) as {
    choices: { message: { content: string } }[];
  };
  const messageContent = text.choices[0]?.message?.content;

  return messageContent ?? "Error: No message content";
}
