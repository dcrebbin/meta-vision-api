chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Request received", request);
  if (request.action === "takeScreenshot") {
    console.log("taking screenshot");

    // Start async work and return true to indicate we'll send response later
    fetch("http://localhost:3103/api/vision", {
      method: "POST",
      body: JSON.stringify({ imageUrl: request.imageUrl }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text(); // Get response as text first
        try {
          return JSON.parse(text); // Try to parse as JSON
        } catch (e) {
          throw new Error(`Invalid JSON response: ${text}`);
        }
      })
      .then((data) => {
        console.log("Response", data);
        sendResponse({ data });
      })
      .catch((error) => {
        console.error("Error:", error);
        sendResponse({ error: error.message });
      });

    return true; // This is important! Keeps the message channel open
  }
});
