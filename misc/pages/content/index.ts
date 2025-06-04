// import { takeAScreenshot } from "./agent";

console.log("Meta Glasses Video Monitor extension loaded");

let stream: MediaStream | null = null;
let isPermissionGranted = false;
let isWaitingForResponse = false;
let isMonitoring = false;
let intervalId: NodeJS.Timeout | null = null;
// JPEG quality 0.5 = 50% quality
let imageQuality = 0.5;
// Monitoring interval in milliseconds (how often to take a screenshot and send it to the server)
let interval = 1000;

// Whether the call is in full screen mode or half screen mode
let isFullScreen = false;
// Width & vertical cropping in pixels (how much to crop from each side of the image)
// Adjustments will need to be made depending on your screen dimensions
let widthCropping = isFullScreen ? 1150 : 300;
let verticalCropping = isFullScreen ? 200 : 100;
// Whether the screenshot button sends the image to the server or downloads it
let screenshotButtonSendsToServer = true;
let conversationName = "ChatGPT";
const onTheCallScreen = document.location.href.includes("groupcall/ROOM");
const onTheConversationScreen = document.location.href.includes("messages/t/");

const cameraOnIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
</svg>
`;
const cameraOffIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 0 1-2.25-2.25V9m12.841 9.091L16.5 19.5m-1.409-1.409c.407-.407.659-.97.659-1.591v-9a2.25 2.25 0 0 0-2.25-2.25h-9c-.621 0-1.184.252-1.591.659m12.182 12.182L2.909 5.909M1.5 4.5l1.409 1.409" />
</svg>
`;

const chatOnIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
</svg>`;

const chatOffIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
</svg>`;

const screenshotIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
  <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
</svg>
`;

const permissionsIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 4.5-15 15m0 0h11.25m-11.25 0V8.25" />
</svg>
`;

const tickIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
</svg>`;

function createButton(title: string, id: string, icon: string) {
  const button = document.createElement("button");
  button.style.backgroundColor = "#474747";
  button.addEventListener("mouseover", () => {
    if (button.disabled || button.style.backgroundColor === "green") {
      return;
    }
    button.style.backgroundColor = "#666666";
  });
  button.addEventListener("mouseout", () => {
    if (button.disabled || button.style.backgroundColor === "green") {
      return;
    }
    button.style.backgroundColor = "#474747";
  });
  button.style.display = "flex";
  button.style.flexDirection = "row";
  button.style.gap = "5px";
  button.style.alignItems = "center";
  button.style.justifyContent = "center";
  button.style.boxShadow = "0px 0px 10px 0px rgba(0, 0, 0, 0.5)";
  button.style.color = "white";
  button.style.border = "none";
  button.style.fontSize = "14px";
  button.style.fontWeight = "bold";
  button.style.padding = "10px";
  button.style.borderRadius = "5px";
  button.style.cursor = "pointer";
  const buttonText = document.createElement("span");
  buttonText.textContent = title;
  buttonText.style.fontSize = "14px";
  buttonText.style.fontWeight = "bold";
  button.appendChild(buttonText);
  button.id = id;

  const iconElement = document.createElement("span");
  iconElement.style.width = "20px";
  iconElement.style.height = "20px";
  iconElement.innerHTML = icon;
  button.appendChild(iconElement);
  return button;
}

const takeScreenshotButton = createButton(
  "Take Screenshot",
  "take-screenshot-button",
  screenshotIcon
);

const videoMonitoringButton = createButton(
  "Start Video Monitoring",
  "monitoring-button",
  cameraOffIcon
);

const chatMonitoringButton = createButton(
  "Start Chat Monitoring",
  "chat-monitoring-button",
  chatOffIcon
);

let chatObserver: MutationObserver | null = null;

chatMonitoringButton.addEventListener("click", () => {
  if (isMonitoring) {
    isMonitoring = false;
    chatMonitoringButton.children[0].innerHTML = "Start Chat Monitoring";
    chatMonitoringButton.children[1].innerHTML = chatOffIcon;
    if (chatObserver) {
      chatObserver.disconnect();
      chatObserver = null;
    }
  } else {
    isMonitoring = true;
    chatMonitoringButton.children[0].innerHTML = "Stop Chat Monitoring";
    chatMonitoringButton.children[1].innerHTML = chatOnIcon;
    const chat = document.querySelector(
      `div[aria-label='Messages in conversation titled ${conversationName}']`
    ) as HTMLDivElement;
    if (chat) {
    }
  }
});

async function sendImage(base64Image: string) {
  const fileInput = document.querySelector(
    'input[type="file"]'
  ) as HTMLInputElement;
  if (!fileInput) {
    return;
  }
  // Convert base64 to binary
  const binaryStr = atob(base64Image);
  const len = binaryStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: "image/png" });
  const file = new File([blob], "screenshot.png", { type: "image/png" });
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  fileInput.files = dataTransfer.files;

  const event = new Event("change", { bubbles: true });
  fileInput.dispatchEvent(event);
}

async function sendMessage(message: string) {
  if (message == "audio.mp3") {
    return;
  }
  sendLog({
    content: message ?? "",
    timeReceived: new Date().toISOString(),
  });

  const response = await chrome.runtime.sendMessage({
    action: "sendMessage",
    message: message,
    model:
      conversationName.toLowerCase() === "perplexity" ? "perplexity" : "openai",
  });
  if (response) {
    sendLog({
      content: response.data,
      timeReceived: new Date().toISOString(),
    });
    enterMessage(response.data);
    setTimeout(async () => {
      sendMessageViaInput();
      await generateTts(response.data);
      // const segments = response.data
      //   .split(/(\p{Script=Han}+)/u)
      //   .filter(Boolean);

      // for (const segment of segments) {
      //   await generateTts(segment);
      // }
    }, 100);
  }
}

async function generateTts(message: string) {
  console.log("Generating TTS");
  const response = await chrome.runtime
    .sendMessage({
      action: "tts",
      message: message,
    })
    .catch((error) => {
      console.error("Error:", error);
      return null;
    });
  console.log("Response", response);
  const base64Audio = response?.data;
  if (base64Audio) {
    attachAudio(base64Audio);
    setTimeout(() => {
      sendMessageViaInput();
    }, 300);
  }
}

function attachAudio(audio: string) {
  const fileInput = document.querySelector(
    'input[type="file"]'
  ) as HTMLInputElement;
  if (!fileInput) {
    return;
  }
  const binaryStr = atob(audio);
  const len = binaryStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: "audio/mpeg" });
  const file = new File([blob], "audio.mp3", { type: "audio/mpeg" });
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  fileInput.files = dataTransfer.files;

  const event = new Event("change", { bubbles: true });
  fileInput.dispatchEvent(event);
}

function sendMessageViaInput() {
  const messageInput = document.querySelector(
    "div[aria-label='Message']"
  ) as HTMLDivElement;
  const event = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    key: "Enter",
  });
  messageInput.dispatchEvent(event);
}

async function scrapybaraSendMessage() {
  // await sendImage(base64Image);
  // setTimeout(() => {
  //   sendMessageViaInput();
  // }, 500);
}

function enterMessage(message: string) {
  const messageInput = document.querySelector("div[aria-label='Message']");
  if (!messageInput) {
    return;
  }

  messageInput.innerHTML = message;
  messageInput.dispatchEvent(new Event("focus"));
  messageInput.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      cancelable: true,
      data: message,
      inputType: "insertText",
    })
  );
}

function sendMessageViaInput() {
  const messageInput = document.querySelector(
    "div[aria-label='Message']"
  ) as HTMLDivElement;
  const event = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    key: "Enter",
  });
  messageInput.dispatchEvent(event);
}

videoMonitoringButton.addEventListener("click", () => {
  if (isMonitoring) {
    isMonitoring = false;
    videoMonitoringButton.children[0].innerHTML = "Start Video Monitoring";
    videoMonitoringButton.children[1].innerHTML = cameraOffIcon;
    enableButton(takeScreenshotButton);
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  } else {
    isMonitoring = true;
    videoMonitoringButton.children[0].innerHTML = "Stop Video Monitoring";
    videoMonitoringButton.children[1].innerHTML = cameraOnIcon;
    disableButton(takeScreenshotButton);
    intervalId = setInterval(() => {
      takeAndSendScreenshot();
    }, interval);
  }
});

function createMonitoringIntervalContainer() {
  const intervalLabel = document.createElement("p");
  intervalLabel.textContent = "Monitoring Interval (ms):";
  intervalLabel.style.marginLeft = "10px";
  intervalLabel.style.fontSize = "14px";
  intervalLabel.style.fontWeight = "bold";
  intervalLabel.style.color = "white";
  const intervalContainer = document.createElement("div");
  intervalContainer.style.backgroundColor = "#474747";
  intervalContainer.style.borderRadius = "5px";
  intervalContainer.style.display = "flex";
  intervalContainer.style.alignItems = "center";

  const intervalInput = document.createElement("input");
  intervalInput.type = "number";
  intervalInput.placeholder = "Interval (ms)";
  intervalInput.style.backgroundColor = "#474747";
  intervalInput.style.color = "white";
  intervalInput.style.fontSize = "14px";
  intervalInput.style.fontWeight = "bold";
  intervalInput.value = "1000";
  intervalInput.min = "250";
  intervalInput.max = "10000";
  intervalInput.style.borderRadius = "5px";
  intervalInput.style.border = "none";
  intervalInput.addEventListener("change", (e) => {
    interval = Number((e.target as HTMLInputElement).value);
  });
  intervalContainer.appendChild(intervalLabel);
  intervalContainer.appendChild(intervalInput);
  return intervalContainer;
}

function disableButton(button: HTMLButtonElement) {
  button.disabled = true;
  button.style.backgroundColor = "gray";
  button.style.cursor = "not-allowed";
}

function buttonLoading(button: HTMLButtonElement) {
  button.disabled = true;
  button.style.backgroundColor = "gray";
  button.style.cursor = "wait";
}

function enableButton(button: HTMLButtonElement) {
  button.disabled = false;
  button.style.backgroundColor = "#474747";
  button.style.cursor = "pointer";
}

const requestPermissionButton = createButton(
  "Request Permissions",
  "request-permission-button",
  permissionsIcon
);

function downloadImage(imageUrl: string) {
  const a = document.createElement("a");
  a.href = imageUrl;
  a.download = "screenshot.png";
  a.click();
}

async function sendImageToServer(imageUrl: string) {
  const response = (await chrome.runtime.sendMessage({
    action: "takeScreenshot",
    imageUrl,
  })) as { data: { content: string; timeReceived: string } };
  isWaitingForResponse = false;
  enableButton(takeScreenshotButton);
  sendLog(response.data);
}

takeScreenshotButton.addEventListener("click", () => {
  console.log("Take Screenshot button clicked");
  if (isWaitingForResponse) {
    return;
  }
  isWaitingForResponse = true;
  buttonLoading(takeScreenshotButton);
  takeAndSendScreenshot(screenshotButtonSendsToServer);
});

function sendLog(data: { content: string; timeReceived: string }) {
  chrome.runtime.sendMessage(
    {
      action: "addLog",
      message: data.content,
      timeReceived: data.timeReceived,
    },
    (response: any) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending message:", chrome.runtime.lastError);
        return;
      }
      console.log("Message sent successfully:", response);
    }
  );
}

requestPermissionButton.addEventListener("click", () => {
  console.log("Request Permission button clicked");
  if (isPermissionGranted) {
    return;
  }
  requestDisplayPermission();
});

function createMainContainer() {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.bottom = "10px";
  container.style.right = "10px";
  container.style.zIndex = "999999";
  container.style.display = "flex";
  container.style.flexDirection = "row";
  container.style.gap = "10px";
  return container;
}

function createConversationNameInput() {
  const input = document.createElement("input");
  input.type = "text";
  input.value = conversationName;
  input.id = "conversation-name-input";
  input.placeholder = "Conversation Name";
  input.style.backgroundColor = "#474747";
  input.style.color = "white";
  input.style.fontSize = "14px";
  input.style.fontWeight = "bold";
  input.style.borderRadius = "5px";
  input.style.border = "none";
  input.style.padding = "10px";
  input.style.width = "200px";
  input.addEventListener("change", (e) => {
    const value = (e.target as HTMLInputElement).value;
    conversationName = value;
  });
  return input;
}

function addCustomUI() {
  const mainContainer = createMainContainer();
  if (onTheConversationScreen || onTheCallScreen) {
    mainContainer.appendChild(createConversationNameInput());
    mainContainer.appendChild(chatMonitoringButton);
  }
  if (onTheCallScreen) {
    const intervalContainer = createMonitoringIntervalContainer();
    mainContainer.appendChild(intervalContainer);
    mainContainer.appendChild(videoMonitoringButton);
    mainContainer.appendChild(takeScreenshotButton);
    mainContainer.appendChild(requestPermissionButton);
  }
  document.body.appendChild(mainContainer);
}

function init() {
  disableButton(takeScreenshotButton);
  disableButton(videoMonitoringButton);
  addCustomUI();
}

init();
