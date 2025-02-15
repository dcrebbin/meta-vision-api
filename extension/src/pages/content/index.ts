console.log("Meta Glasses Video Monitor extension loaded");

let isMonitoring = false;
// add a button to the page
const button = document.createElement("button");
button.style.position = "fixed";
button.style.bottom = "10px";
button.style.right = "10px";
button.style.zIndex = "999999";
button.style.backgroundColor = "white";
button.style.color = "black";
button.style.border = "none";
button.style.padding = "10px";
button.style.borderRadius = "5px";
button.textContent = "Monitor Video";
button.addEventListener("click", () => {
  console.log("Monitor Video button clicked");
  isMonitoring = !isMonitoring;
  if (isMonitoring) {
    button.textContent = "Stop Monitoring";
  } else {
    button.textContent = "Monitor Video";
  }
});
document.body.appendChild(button);
