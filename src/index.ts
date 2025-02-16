import { readFile, writeFile } from "fs/promises";

// Use this pre-prompt to customize what you want your specified vision model todo
const PRE_PROMPT = `What is in this image?`;

//enum for the different models
enum VisionModel {
  GPT_4_O = "gpt-4o",
  GPT_4_O_MINI = "gpt-4o-mini",
  SONNET_3_5 = "sonnet-3.5",
  GEMINI_FLASH_2 = "gemini-flash-2",
  DEEPSEEK_R1 = "deepseek-r1",
  QWEN_2_5 = "qwen-2.5",
}

enum AiProviderEndpoints {
  OPENAI = "https://api.openai.com/v1/chat/completions",
  ANTHROPIC = "https://api.anthropic.com/v1/messages",
  GEMINI = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
  DEEPSEEK = "https://api.deepseek.com/v1/chat/completions",
  QWEN = "https://api.qwen.aliyun.com/v1/chat/completions",
}

const VISION_MODEL = VisionModel.GPT_4_O_MINI;
const VISION_ENDPOINT = AiProviderEndpoints.OPENAI;
const SAVED_DATA = "./public/data.json";

//Facebook Messenger whitelists this localhost port so is the only one you can currently use
const PORT = 3103;

const CORS_HEADERS = {
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS, POST",
    "Access-Control-Allow-Headers": "Content-Type",
  },
};

const server = Bun.serve({
  port: PORT,
  fetch(request) {
    console.log("Request received", request.method, request.url);
    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      const res = new Response("Departed", CORS_HEADERS);
      return res;
    }
    const url = new URL(request.url);
    switch (url.pathname) {
      case "/api/vision":
        console.log("Vision Request");
        return handleVisionRequest(request);
      case "/api/status":
        console.log("API Status Request");
        return new Response("Server Up!", { status: 200 });
      default:
        console.log("Not Found Request");
        return new Response("Not Found", { status: 404 });
    }
  },
});

async function handleVisionRequest(request: Request) {
  if (
    request.method !== "POST" ||
    request.headers.get("Content-Type") !== "application/json"
  ) {
    console.log(
      "Invalid request",
      request.method,
      request.headers.get("Content-Type")
    );
    return new Response("Invalid request", { status: 400 });
  }

  try {
    const receivedTime = new Date().toISOString();
    const imageUrl = (await request.json()).imageUrl;
    const responseContent = await analyzeImage(imageUrl);
    await saveData(imageUrl, responseContent);
    return new Response(
      JSON.stringify({ content: responseContent, timeReceived: receivedTime }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

async function analyzeImage(imageUrl: string) {
  const token = process.env.VISION_API_KEY;
  const body = {
    model: VISION_MODEL,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: PRE_PROMPT },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
  };
  console.log("Sending request to our specified vision model");
  const response = await fetch(VISION_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    console.log("Request Failed");
    throw new Error(`API request failed with status: ${response.status}`);
  }
  console.log("Request Successful");
  const data = await response.json();
  return data.choices[0].message.content;
}

// Pseudo database via a JSON file
async function saveData(imageUrl: string, description: string) {
  console.log("Saving data");
  const createdObject = {
    time: new Date().toISOString(),
    imageDescription: description,
  };
  try {
    let data = [];
    try {
      console.log("Reading stored data");
      const storedData = await readFile(SAVED_DATA, "utf8");
      data = JSON.parse(storedData);
    } catch (readError) {
      // If the file doesn't exist, we'll create a new one
      console.log("Creating new data file.");
    }
    data.push(createdObject);
    console.log("Writing new data");
    await writeFile(SAVED_DATA, JSON.stringify(data));
  } catch (writeError) {
    throw new Error(`Failed to write to file: ${writeError}`);
  }
}

console.log(`Listening on localhost:${server.port}`);
