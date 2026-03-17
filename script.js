document.getElementById('snap').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const status = document.getElementById('status');

    status.innerText = "Capturing...";

    chrome.runtime.sendMessage({
        action: "take_screenshot",
        tabId: tab.id,
        width: 1280,
        height: 960
    }, (response) => {
        if (response?.success) {
            document.getElementById('result').src = response.dataUrl;
            status.innerText = "Done!";
        } else {
            status.innerText = "Error: " + (response?.error || "Unknown");
        }
    });
});
