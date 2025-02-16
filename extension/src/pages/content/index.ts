console.log("Meta Glasses Video Monitor extension loaded");

let stream: MediaStream | null = null;
let isPermissionGranted = false;

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

const monitorVideoButton = createButton(
  "Take Screenshot",
  "take-screenshot-button"
);

function disableButton(button: HTMLButtonElement) {
  button.disabled = true;
  button.style.backgroundColor = "gray";
  button.style.cursor = "not-allowed";
}
disableButton(monitorVideoButton);

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
    enableButton(monitorVideoButton);
  }
}

async function takeScreenOfWebPage() {
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
  })) as { data: string };

  sendLog(response.data);
}

monitorVideoButton.addEventListener("click", () => {
  console.log("Take Screenshot button clicked");
  takeScreenOfWebPage();
});

function sendLog(message: string) {
  chrome.runtime.sendMessage(
    {
      action: "addLog",
      message: message,
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

function createContainer() {
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

const container = createContainer();
container.appendChild(monitorVideoButton);
container.appendChild(requestPermissionButton);

document.body.appendChild(container);
