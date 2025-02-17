let OPENAI_API_KEY = "";
let PERPLEXITY_API_KEY = "";
let SCRAPYBARA_API_KEY = "";

function openAiRequest(message: string) {
  return fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: message }],
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
  });
}

function openAiTtsRequest(message: string) {
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

function perplexityRequest(message: string) {
  return fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    body: JSON.stringify({
      model: "sonar-pro",
      messages: [
        {
          role: "system",
          content: "Be precise and concise.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
    },
  });
}

chrome.storage.local.get(
  ["scrapybaraApiKey", "perplexityApiKey", "openaiApiKey"],
  (result) => {
    OPENAI_API_KEY = result.openaiApiKey;
    PERPLEXITY_API_KEY = result.perplexityApiKey;
    SCRAPYBARA_API_KEY = result.scrapybaraApiKey;
  }
);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Request received", request);
  if (request.action === "takeScreenshot") {
    console.log("taking screenshot");

    fetch("http://localhost:3103/api/vision", {
      method: "POST",
      body: JSON.stringify({ imageUrl: request.imageUrl }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text(); // Get response as text first
        try {
          return JSON.parse(text); // Try to parse as JSON
        } catch (e) {
          throw new Error(`Invalid JSON response: ${text}`);
        }
      })
      .then((data) => {
        console.log("Response", data);
        sendResponse({ data });
      })
      .catch((error) => {
        console.error("Error:", error);
        sendResponse({ error: error.message });
      });

    return true; // This is important! Keeps the message channel open
  }

  if (request.action === "tts") {
    console.log("tts");
    openAiTtsRequest(request.message)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log("Response", response);
        const audioBlob = await response.blob();
        const base64 = await audioBlob.arrayBuffer();
        const base64Audio = btoa(
          String.fromCharCode(...new Uint8Array(base64))
        );
        console.log("Audio Blob", audioBlob);
        sendResponse({ data: base64Audio });
      })
      .catch((error) => {
        console.error("Error:", error);
        sendResponse({ error: error.message });
      });
    return true;
  }

  if (request.action === "sendMessage") {
    console.log("sending message");

    const model = request.model;

    if (model === "openai") {
      openAiRequest(request.message)
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const text = await response.json();
          const message = text.choices[0].message.content;
          sendResponse({ data: message });
        })
        .catch((error) => {
          console.error("Error:", error);
          sendResponse({ error: error.message });
        });
    } else if (model === "perplexity") {
      perplexityRequest(request.message)
        .then(async (response) => {
          const text = await response.json();
          const message = text.choices[0].message.content;
          sendResponse({ data: message });
        })
        .catch((error) => {
          console.error("Error:", error);
          sendResponse({ error: error.message });
        });
    }
    return true;
  }
});
