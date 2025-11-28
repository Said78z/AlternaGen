document.getElementById('saveBtn').addEventListener('click', async () => {
    const statusDiv = document.getElementById('status');
    const btn = document.getElementById('saveBtn');

    btn.disabled = true;
    statusDiv.textContent = 'Extracting data...';
    statusDiv.className = '';

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Execute content script to get data
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: extractJobData,
        });

        const jobData = results[0].result;

        if (!jobData) {
            throw new Error('Could not extract job data.');
        }

        statusDiv.textContent = 'Sending to AlternaGen...';

        // Send to background script to handle API call
        const response = await chrome.runtime.sendMessage({
            type: 'SAVE_JOB',
            data: jobData
        });

        if (response.success) {
            statusDiv.textContent = 'Job saved successfully!';
            statusDiv.className = 'success';
        } else {
            throw new Error(response.error || 'Failed to save.');
        }

    } catch (error) {
        console.error(error);
        statusDiv.textContent = error.message;
        statusDiv.className = 'error';
    } finally {
        btn.disabled = false;
    }
});

// This function is executed in the context of the page
function extractJobData() {
    // Simple heuristics - can be improved with specific selectors for LinkedIn, Indeed, etc.
    const getMeta = (name) => document.querySelector(`meta[property="${name}"]`)?.content ||
        document.querySelector(`meta[name="${name}"]`)?.content;

    const title = getMeta('og:title') || document.title;
    const description = getMeta('og:description') || document.body.innerText.substring(0, 200);
    const url = window.location.href;
    const company = getMeta('og:site_name') || window.location.hostname;

    return {
        title,
        company,
        description,
        url,
        location: 'Unknown', // Hard to guess generically
        date: new Date().toISOString()
    };
}
