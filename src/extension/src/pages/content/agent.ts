import { browserTool } from "scrapybara/tools";
import { anthropic } from "scrapybara/anthropic";
import { UBUNTU_SYSTEM_PROMPT } from "scrapybara/prompts";
import { ScrapybaraClient } from "scrapybara";

let SCRAPYBARA_API_KEY = "";

chrome.storage.local.get("scrapybaraApiKey", (result) => {
  SCRAPYBARA_API_KEY = result.scrapybaraApiKey;
});
export async function takeAScreenshot() {
  if (!SCRAPYBARA_API_KEY) {
    throw new Error("No Scrapybara API key found");
  }
  const client = new ScrapybaraClient({
    apiKey: SCRAPYBARA_API_KEY,
  });

  const instance = await client.startBrowser({
    timeoutHours: 0.01,
  });

  const { messages, steps, text, usage } = await client.act({
    tools: [browserTool(instance)],
    model: anthropic(),
    system: UBUNTU_SYSTEM_PROMPT,
    prompt: "Go to the top link on Hacker News",
    onStep: (step) => console.log(step.text),
  });

  console.log(messages);
  console.log(steps);
  console.log(text);
  console.log(usage);

  const screenshot = await instance.screenshot();
  const base64 = screenshot.base64Image;
  console.log(base64);
  await instance.stop();
  return screenshot.base64Image;
}
