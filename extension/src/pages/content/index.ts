console.log("Meta Glasses Video Monitor extension loaded");

let stream: MediaStream | null = null;
let isPermissionGranted = false;
let isWaitingForResponse = false;
let interval = 500;
let isMonitoring = false;
let intervalId: NodeJS.Timeout | null = null;
let increment = 0;

function createButton(title: string, id: string) {
  const button = document.createElement("button");
  button.style.backgroundColor = "white";
  button.style.color = "black";
  button.style.border = "none";
  button.style.padding = "10px";
  button.style.borderRadius = "5px";
  button.style.cursor = "pointer";
  button.textContent = title;
  button.id = id;
  return button;
}

const takeScreenshotButton = createButton(
  "Take Screenshot",
  "take-screenshot-button"
);

const monitoringButton = createButton("Start Monitoring", "monitoring-button");

monitoringButton.addEventListener("click", () => {
  if (isMonitoring) {
    isMonitoring = false;
    monitoringButton.textContent = "Start Monitoring";
    enableButton(takeScreenshotButton);
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  } else {
    isMonitoring = true;
    monitoringButton.textContent = "Stop Monitoring";
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

  const intervalContainer = document.createElement("div");
  intervalContainer.style.backgroundColor = "white";
  intervalContainer.style.borderRadius = "5px";
  intervalContainer.style.display = "flex";
  intervalContainer.style.alignItems = "center";

  const intervalInput = document.createElement("input");
  intervalInput.type = "number";
  intervalInput.placeholder = "Interval (ms)";
  intervalInput.value = "500";
  intervalInput.min = "100";
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
  button.style.backgroundColor = "white";
  button.style.cursor = "pointer";
}

const requestPermissionButton = createButton(
  "Request Permissions",
  "request-permission-button"
);

async function requestDisplayPermission() {
  stream = await navigator.mediaDevices
    .getDisplayMedia({
      video: true,
      audio: false,
    })
    .catch((err) => {
      isPermissionGranted = false;
      console.error("Error requesting display permission", err);
      return null;
    });
  if (stream) {
    isPermissionGranted = true;
    requestPermissionButton.textContent = "Permissions Granted";
    enableButton(takeScreenshotButton);
    enableButton(monitoringButton);
  }
}

async function takeAndSendScreenshot() {
  if (!stream || !isPermissionGranted) {
    await requestDisplayPermission();
  }

  const track = stream?.getVideoTracks()[0];
  if (!track) {
    alert("No video tracks found");
    return;
  }

  // @ts-ignore
  const imageCapture = new ImageCapture(track);
  const bitmap = await imageCapture.grabFrame();
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d");
  context?.drawImage(bitmap, 0, 0);
  const screenshot = canvas.toDataURL();
  await sendImageToServer(screenshot);
}

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
  takeAndSendScreenshot();
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

function addCustomUI() {
  const mainContainer = createMainContainer();
  const intervalContainer = createMonitoringIntervalContainer();
  mainContainer.appendChild(intervalContainer);
  mainContainer.appendChild(monitoringButton);
  mainContainer.appendChild(takeScreenshotButton);
  mainContainer.appendChild(requestPermissionButton);
  document.body.appendChild(mainContainer);
}

function init() {
  disableButton(takeScreenshotButton);
  disableButton(monitoringButton);
  addCustomUI();
}

init();
