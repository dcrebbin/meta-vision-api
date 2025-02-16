document.getElementById("popoutWindow")?.addEventListener("click", () => {
  chrome.windows.create({
    url: chrome.runtime.getURL("src/pages/popup/popup.html"),
    type: "popup",
    width: 400,
    height: 600,
    focused: true,
  });
});

document.getElementById("toggleLogs")?.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (activeTab.id) {
      chrome.tabs.sendMessage(activeTab.id, { action: "toggleLogs" });
    }
  });
});

function addDevLog(message: string, devLogContainer: HTMLDivElement) {
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "addLog") {
    const logsContainer = document.getElementById("logs-container");
    if (logsContainer) {
      console.log(message);
      addDevLog(message.message, logsContainer as HTMLDivElement);
    }
  }
});
