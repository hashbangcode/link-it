document.getElementById('snap').addEventListener('click', async () => {
    const sendStatus = document.getElementById('send-status');
    sendStatus.classList.add('hidden');
    sendStatus.innerHTML = '';

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const status = document.getElementById('snap-status');

    status.innerText = "Capturing...";

    // Generate screenshot of the page.
    chrome.runtime.sendMessage({
        action: "take_screenshot",
        tabId: tab.id,
        width: 1280,
        height: 960
    }, (response) => {
        if (response?.success) {
             status.innerHTML = "<br>";
            document.getElementById('result-image').src = response.dataUrl;
            document.getElementById('image-data').value = response.dataUrl;
        } else {
            status.innerText = "Error: " + (response?.error || "Unknown");
        }
    });

    const titlefield = document.getElementById('title');
    titlefield.classList.remove('hidden');
    titlefield.value = tab.title;

    const linkurl = document.getElementById('linkurl');
    linkurl.classList.remove('hidden');
    linkurl.value = tab.url;


    const send = document.getElementById('send');
    send.classList.remove('hidden');
});

document.getElementById('send').addEventListener('click', async () => {

    const linkurl = document.getElementById('linkurl');
    const titlefield = document.getElementById('title');
    const imagedata = document.getElementById('image-data');

    const { apiKey, debugMode } = await chrome.storage.sync.get({ apiKey: 'EMPTY', debugMode: false });

    // If the debugMode is set then swap the destination to the ddev instance.
    if (debugMode) {
        var domain = 'hashbangcode.ddev.site';
    } else {
        var domain = 'www.hashbangcode.com';
    }

    // Create the endpoint addresses we will use.
    const tokenUrl = 'https://' + domain + '/session/token';
    const linkCreateUrl = 'https://' + domain + '/api/links/v1/receive-link';

    const data = {
        link: linkurl.value,
        title: titlefield.value,
        imagedata: imagedata.value
    };

    try {
        // Fetch the token.
        const tokenResponse = await fetch(tokenUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'text/plain',
            }
        });

        // Extract the token.
        const tokenResult = await tokenResponse.text();

        // Send link data with our key and csrf token.
        const response = await fetch(linkCreateUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Hashbangcode-Extension': 'link-it',
                'X-CSRF-Token': tokenResult,
                'api-key': apiKey,
            },
            body: JSON.stringify(data)
        });

        // Get the response.
        const result = await response.json();

        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        // Set up the message and display it.
        let successMessage = '';
        if (result.url) {
            successMessage += `Success!<br>`
            successMessage = `<a href="${result.url}" target="_blank">${result.message}</a>`;
        }
        else if (result.message) {
            successMessage += `Success!<br>`
            successMessage = `${result.message}`;
        }
        document.getElementById('send-status').innerHTML = successMessage;
        document.getElementById('send-status').classList.remove('hidden');

    } catch (error) {
        // Display error.
        let failureMessage = '';
        failureMessage += `Failed!<br>`
        failureMessage += error.message;
        document.getElementById('send-status').innerHTML = failureMessage;
        document.getElementById('send-status').classList.remove('hidden');
    }

});

document.getElementById('go-to-options').addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
    } else {
        // Fallback for older versions of Chrome (pre-version 42)
        window.open(chrome.runtime.getURL('options.html'));
    }
    window.close();
});