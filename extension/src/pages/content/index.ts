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

const cameraOnIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
</svg>
`;
const cameraOffIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 0 1-2.25-2.25V9m12.841 9.091L16.5 19.5m-1.409-1.409c.407-.407.659-.97.659-1.591v-9a2.25 2.25 0 0 0-2.25-2.25h-9c-.621 0-1.184.252-1.591.659m12.182 12.182L2.909 5.909M1.5 4.5l1.409 1.409" />
</svg>
`;

const screenshotIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
  <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
</svg>
`;

const permissionsIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 4.5-15 15m0 0h11.25m-11.25 0V8.25" />
</svg>
`;

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

const monitoringButton = createButton(
  "Start Monitoring",
  "monitoring-button",
  cameraOffIcon
);

monitoringButton.addEventListener("click", () => {
  if (isMonitoring) {
    isMonitoring = false;
    monitoringButton.children[0].innerHTML = "Start Monitoring";
    monitoringButton.children[1].innerHTML = cameraOffIcon;
    enableButton(takeScreenshotButton);
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  } else {
    isMonitoring = true;
    monitoringButton.children[0].innerHTML = "Stop Monitoring";
    monitoringButton.children[1].innerHTML = cameraOnIcon;
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
  button.style.backgroundColor = "#474747";
  button.style.cursor = "pointer";
}

const requestPermissionButton = createButton(
  "Request Permissions",
  "request-permission-button",
  permissionsIcon
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
    requestPermissionButton.children[0].innerHTML = "Permissions Granted";
    requestPermissionButton.style.backgroundColor = "green";
    requestPermissionButton.children[1].innerHTML = "✓";
    enableButton(takeScreenshotButton);
    enableButton(monitoringButton);
  }
}

async function takeAndSendScreenshot(sendToServer: boolean = true) {
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
  const croppedImage = await cropImage(screenshot);
  if (sendToServer) {
    await sendImageToServer(croppedImage);
  } else {
    downloadImage(croppedImage);
  }
  isWaitingForResponse = false;
  enableButton(takeScreenshotButton);
}

function cropImage(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      // Crop 300px from each side (left and right) to estimate the size of the video call window in portrait mode
      const horizontalCrop = 300;
      canvas.width = image.width - horizontalCrop * 2;
      // Reduce height by 100px to account for the monitoring bottom bar
      canvas.height = image.height - 100;
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(image, -horizontalCrop, 0);
        const croppedImage = canvas.toDataURL("image/jpeg", imageQuality);
        resolve(croppedImage);
      }
    };
    image.src = imageUrl;
  });
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
  takeAndSendScreenshot(false);
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
