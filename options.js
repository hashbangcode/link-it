// Save options to chrome.storage
const saveOptions = () => {
    const apiKey = document.getElementById('api-key').value;
    const debugMode = document.getElementById('debug-mode').checked;

    chrome.storage.sync.set({ apiKey: apiKey, debugMode: debugMode}, () => {
        // Update status to let user know options were saved.
        const status = document.getElementById('status');
        status.textContent = 'Options saved!';
        setTimeout(() => { status.textContent = ''; }, 1000);
    });
};

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
const restoreOptions = () => {
    chrome.storage.sync.get({ apiKey: '', debugMode: false}, (items) => {
        document.getElementById('api-key').value = items.apiKey;
        document.getElementById('debug-mode').checked = items.debugMode;
    });
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);