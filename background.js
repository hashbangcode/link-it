chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "take_screenshot") {
        // We must call the async function and handle the response
        captureExactSize(message.tabId, message.width, message.height)
            .then((dataUrl) => sendResponse({ success: true, dataUrl }))
            .catch((error) => sendResponse({ success: false, error: error.message }));

        return true; // Keeps the message channel open for the async response
    }
});

async function captureExactSize(tabId, width, height) {
    const target = { tabId };

    // 1. Attach the debugger
    await chrome.debugger.attach(target, "1.3");

    try {
        // 2. Force the page to render at the specific dimensions
        // deviceScaleFactor: 1 ensures a 1:1 pixel ratio (not retina/high-dpi)
        await chrome.debugger.sendCommand(target, "Emulation.setDeviceMetricsOverride", {
            width: width,
            height: height,
            deviceScaleFactor: 1,
            mobile: false,
            screenWidth: width,  // Explicitly set the "monitor" size
            screenHeight: height,
            viewSize: { width: width, height: height }
        });

        // Set the page scaling factor.
        await chrome.debugger.sendCommand(target, "Emulation.setPageScaleFactor", {
            pageScaleFactor: 1
        });

        // 3. Give the browser a "tick" to reflow the layout
        await new Promise(resolve => setTimeout(resolve, 100));

        // 4. Capture the screenshot
        const { data } = await chrome.debugger.sendCommand(target, "Page.captureScreenshot", {
            format: "png",
            clip: {
                x: 0,
                y: 0,
                width: width,
                height: height,
                scale: 1,
            },
            fromSurface: true,
            captureBeyondViewport: true,
        });

        // 5. Reset dimensions
        await chrome.debugger.sendCommand(target, "Emulation.clearDeviceMetricsOverride");

        return `data:image/png;base64,${data}`;
    } finally {
        // Always detach the debugger, even if an error occurs
        await chrome.debugger.detach(target);
    }
}
