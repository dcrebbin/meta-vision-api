document.getElementById("popoutWindow")?.addEventListener("click", () => {
  chrome.windows.create({
    url: chrome.runtime.getURL("src/pages/popup/popup.html"),
    type: "popup",
    width: 400,
    height: 600,
    focused: true,
  });
});

function addDevLog(
  message: string,
  timeReceived: string,
  devLogContainer: HTMLDivElement
) {
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
  const receivedTime = new Date(timeReceived).toLocaleTimeString("en-US", {
    hour12: false,
  });

  const logTime = document.createElement("span");
  const time = new Date().toLocaleTimeString("en-US", { hour12: false });
  logTime.textContent = `Server Received: ${receivedTime} | Server Response: ${time}`;
  logTime.style.fontWeight = "bold";
  logItem.appendChild(logTime);
  devLogContainer.appendChild(logItem);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "addLog") {
    const logsContainer = document.getElementById("logs-container");
    if (logsContainer) {
      console.log(message);
      addDevLog(
        message.message,
        message.timeReceived,
        logsContainer as HTMLDivElement
      );
    }
  }
});
