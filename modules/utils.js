/**
 * Format markdown text to HTML (Simple formatter)
 * @param {string} text 
 * @returns {string}
 */
export function formatMarkdown(text) {
    if (!text) return '';
    let html = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/\n/g, "<br>");
    return html;
}

/**
 * Capture screenshot of the active tab
 * @returns {Promise<string>} Data URL of the screenshot
 */
export async function captureTab() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs || tabs.length === 0) {
                reject(new Error("No active tab found."));
                return;
            }
            const activeTab = tabs[0];
            const windowId = activeTab.windowId;

            chrome.tabs.captureVisibleTab(windowId, { format: 'png' }, (dataUrl) => {
                if (chrome.runtime.lastError) {
                    const errorMsg = chrome.runtime.lastError.message;
                    if (errorMsg.includes("permission") || errorMsg.includes("activeTab")) {
                        reject(new Error(`Cannot capture page. Extension might need 'activeTab' permissions or a reload. (Details: ${errorMsg})`));
                    } else {
                        reject(chrome.runtime.lastError);
                    }
                } else {
                    resolve(dataUrl);
                }
            });
        });
    });
}

/**
 * Scrape text from the active page
 * @returns {Promise<string>}
 */
export async function scrapePageText() {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs || tabs.length === 0) {
                resolve('');
                return;
            }
            const activeTab = tabs[0];

            // IGNORE: restricted pages where scripting is not allowed
            const restrictedPrefixes = [
                'chrome://',
                'edge://',
                'about:',
                'view-source:',
                'chrome-extension://',
                'https://chrome.google.com/webstore',
                'https://chromewebstore.google.com'
            ];

            if (!activeTab.url || restrictedPrefixes.some(p => activeTab.url.startsWith(p))) {
                console.log(`[Lumina] Skipping text scrape for restricted URL: ${activeTab.url}`);
                resolve('');
                return;
            }

            chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                func: () => {
                    return document.body.innerText;
                }
            }, (results) => {
                if (chrome.runtime.lastError) {
                    const msg = chrome.runtime.lastError.message;
                    console.log(`[Lumina] Scripting skipped/failed: ${msg}`);
                    resolve('');
                } else if (!results || !results[0]) {
                    resolve('');
                } else {
                    resolve(results[0].result || '');
                }
            });
        });
    });
}

/**
 * Extract follow-up suggestions from JSON block in text
 * @param {string} text 
 * @returns {{cleanText: string, suggestions: string[]}}
 */
export function extractFollowUps(text) {
    if (!text) return { cleanText: '', suggestions: [] };

    // Robust Regex to find the JSON block: :::JSON ... :::
    const jsonRegex = /:::JSON([\s\S]*?):::/i;
    const match = text.match(jsonRegex);

    if (match && match[1]) {
        try {
            let jsonStr = match[1].trim();
            let suggestions = [];
            try {
                suggestions = JSON.parse(jsonStr);
            } catch (e1) {
                // Fallback: Try wrapping in brackets if not present
                if (!jsonStr.startsWith('[')) {
                    suggestions = JSON.parse(`[${jsonStr}]`);
                } else {
                    throw e1;
                }
            }

            // Remove the block from the text
            const cleanText = text.replace(match[0], '').trim();

            return { cleanText, suggestions };
        } catch (e) {
            console.warn("Failed to parse follow-up JSON:", e);
        }
    }

    // Fallback: No JSON found
    return { cleanText: text, suggestions: [] };
}
