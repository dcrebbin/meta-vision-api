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
  downloadImage(screenshot);
  await sendImageToServer(screenshot);
}

function downloadImage(imageUrl: string) {
  const a = document.createElement("a");
  a.href = imageUrl;
  a.download = "screenshot.png";
  a.click();
}

function createDevLogContainer() {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.bottom = "10px";
  container.style.right = "10px";
  container.style.top = "10px";
  container.id = "dev-log-container";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.gap = "10px";
  container.style.zIndex = "999999";
  container.style.backgroundColor = "#1c1e21";
  container.style.color = "white";
  container.style.padding = "10px";
  container.style.borderRadius = "5px";
  container.style.border = "1px solid black";
  container.style.width = "300px";
  container.style.height = "300px";
  container.style.overflowY = "auto";
  container.style.boxShadow = "rgba(0, 0, 0, 0.3) 0px 0px 16px 0px";

  const heading = document.createElement("h1");
  heading.style.color = "white";
  heading.textContent = "Log Viewer";
  container.appendChild(heading);
  return container;
}

const devLogContainer = createDevLogContainer();

function addDevLog(message: string) {
  const logItem = document.createElement("div");
  logItem.style.background = "rgb(76, 76, 76)";
  logItem.style.borderRadius = "0px 5px 0px 5px";
  logItem.style.padding = "10px";
  const logText = document.createElement("p");
  logText.style.margin = "0px";
  logText.style.color = "white";
  logText.style.padding = "0px 5px 5px 0px";
  logText.textContent = message;
  logItem.appendChild(logText);
  const logTime = document.createElement("span");
  const time = new Date().toLocaleTimeString("en-US", { hour12: false });
  logTime.textContent = time;
  logTime.style.fontWeight = "bold";
  logItem.appendChild(logTime);
  devLogContainer.appendChild(logItem);
}

addDevLog("hello");
addDevLog(
  "hello odfghjsdofhjsodgjhsod jsodfi jsdofjsdoi jsdoi jsdoif jsdoif jsdof jsdoif jsdo "
);
addDevLog("hello");
addDevLog("hello osdifj osdigj dosfigjdsof jsdogjsdog isdjgoi sdjgo");

async function sendImageToServer(imageUrl: string) {
  const response = (await chrome.runtime.sendMessage({
    action: "takeScreenshot",
    imageUrl,
  })) as { data: string };

  addDevLog(response.data);
}

monitorVideoButton.addEventListener("click", () => {
  console.log("Take Screenshot button clicked");
  takeScreenOfWebPage();
});

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
document.body.appendChild(devLogContainer);
