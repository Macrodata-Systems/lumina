import { callGemini } from './services/gemini.js';
import { callOpenAI } from './services/openai.js';
import { callAnthropic } from './services/anthropic.js';

document.addEventListener('DOMContentLoaded', () => {
    const settingsBtn = document.getElementById('settings-btn');
    const mainView = document.getElementById('main-view');
    const settingsView = document.getElementById('settings-view');
    const backBtn = document.getElementById('back-btn');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const explainBtn = document.getElementById('explain-btn');
    
    const themeToggleBtn = document.getElementById('theme-toggle');

    // Inputs
    const geminiKeyInput = document.getElementById('gemini-key');
    const openaiKeyInput = document.getElementById('openai-key');
    const anthropicKeyInput = document.getElementById('anthropic-key');

    // Load Settings & Theme
    chrome.storage.local.get(['geminiKey', 'openaiKey', 'anthropicKey', 'theme'], (result) => {
        if (result.geminiKey) geminiKeyInput.value = result.geminiKey;
        if (result.openaiKey) openaiKeyInput.value = result.openaiKey;
        if (result.anthropicKey) anthropicKeyInput.value = result.anthropicKey;
        
        // Apply saved theme or default to light
        const currentTheme = result.theme || 'dark';
        applyTheme(currentTheme);
    });

    // Theme Toggle Logic
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
    });

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        chrome.storage.local.set({ theme });
        
        // Update Icon: Sun for Dark Mode (to switch to light), Moon for Light Mode
        if (theme === 'dark') {
            themeToggleBtn.innerHTML = '☀️';
        } else {
            themeToggleBtn.innerHTML = '🌙';
        }
    }

    // Navigation
    settingsBtn.addEventListener('click', () => {
        openSettings(); // No arg = show all
    });

    backBtn.addEventListener('click', () => {
        settingsView.classList.add('hidden');
        mainView.classList.remove('hidden');
        settingsBtn.classList.remove('hidden');
        document.querySelector('.header-actions').classList.remove('hidden'); 
    });

    // Config Buttons Logic
    document.querySelectorAll('.config-btn').forEach(btn => {
        btn.addEventListener('click', () => {
             const targetId = btn.getAttribute('data-target');
             openSettings(targetId);
        });
    });

    function openSettings(focusId = null) {
        mainView.classList.add('hidden');
        settingsView.classList.remove('hidden');
        settingsBtn.classList.add('hidden');

        // Filter input groups based on focusId
        const groups = settingsView.querySelectorAll('.input-group');
        groups.forEach(group => {
            if (!focusId) {
                // Show all
                group.classList.remove('hidden');
            } else {
                // Show only if group contains the target input
                if (group.querySelector(`#${focusId}`)) {
                    group.classList.remove('hidden');
                } else {
                    group.classList.add('hidden');
                }
            }
        });

        // Focus the input if specific one requested
        if (focusId) {
             const input = document.getElementById(focusId);
             if (input) setTimeout(() => input.focus(), 100);
        }
    }

    // Save Settings
    saveSettingsBtn.addEventListener('click', () => {
        const keys = {
            geminiKey: geminiKeyInput.value.trim(),
            openaiKey: openaiKeyInput.value.trim(),
            anthropicKey: anthropicKeyInput.value.trim()
        };
        chrome.storage.local.set(keys, () => {
            alert('Settings saved!');
            backBtn.click();
        });
    });

    // Auto-Explain Logic
    const startExplanation = async () => {
        const resultsContainer = document.getElementById('results-container');
        resultsContainer.classList.remove('hidden');
        explainBtn.classList.add('hidden'); // Hide button if shown
        
        // Show loading state
        updateSection('gemini-section', 'Loading...');
        updateSection('openai-section', 'Loading...');
        updateSection('anthropic-section', 'Loading...');

        try {
            // Capture Screenshot
            const screenshotUrl = await captureTab();
            
            // Trigger explanations (Parallel)
            chrome.storage.local.get(['geminiKey', 'openaiKey', 'anthropicKey'], (keys) => {
                if(keys.geminiKey) {
                    callGemini(keys.geminiKey, screenshotUrl)
                        .then(text => updateSection('gemini-section', classFormatMarkdown(text)))
                        .catch(err => updateSection('gemini-section', 'Error: ' + err.message));
                } else {
                    updateSection('gemini-section', 'API Key not configured.');
                }

                if(keys.openaiKey) {
                    callOpenAI(keys.openaiKey, screenshotUrl)
                         .then(text => updateSection('openai-section', classFormatMarkdown(text)))
                         .catch(err => updateSection('openai-section', 'Error: ' + err.message));
                } else {
                    updateSection('openai-section', 'API Key not configured.');
                }

                if(keys.anthropicKey) {
                    callAnthropic(keys.anthropicKey, screenshotUrl)
                        .then(text => updateSection('anthropic-section', classFormatMarkdown(text)))
                        .catch(err => updateSection('anthropic-section', 'Error: ' + err.message));
                } else {
                    updateSection('anthropic-section', 'API Key not configured.');
                }
            });

        } catch (err) {
            if (err.message.includes("Cannot capture")) {
                console.warn("Known limitation:", err.message);
            } else {
                console.error(err);
            }
            updateSection('gemini-section', 'Error capturing tab: ' + err.message);
        }
    };

    // Auto-Refresh Logic
    let debounceTimer;
    const triggerRefresh = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            startExplanation(); 
        }, 800); 
    };

    // Listeners for Tab Switching and Navigation
    chrome.tabs.onActivated.addListener(triggerRefresh);
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete' && tab.active) {
            triggerRefresh();
        }
    });

    // Ensure we run on initial load
    if (settingsView.classList.contains('hidden')) {
        setTimeout(startExplanation, 100);
    }

    // Keep button listener just in case or for retry
    explainBtn.addEventListener('click', startExplanation);

    function updateSection(id, text) {
        // Simple MD replacement for newlines, bold, italics could be added here or use a library
        // For now, textContent is safe, innerHTML with some parsing is better
        const contentDiv = document.querySelector(`#${id} .content`);
        contentDiv.innerHTML = text; // Assumes classFormatMarkdown returns safe HTML
    }

    // Very basic markdown formatter to handle bold and newlines
    function classFormatMarkdown(text) {
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

    async function captureTab() {
        return new Promise((resolve, reject) => {
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (!tabs || tabs.length === 0) {
                    reject(new Error("No active tab found."));
                    return;
                }
                const activeTab = tabs[0];
                const windowId = activeTab.windowId;

                chrome.tabs.captureVisibleTab(windowId, {format: 'jpeg', quality: 80}, (dataUrl) => {
                    if (chrome.runtime.lastError) {
                        const errorMsg = chrome.runtime.lastError.message;
                        if (errorMsg.includes("permission") || errorMsg.includes("activeTab")) {
                            // Still showing the friendly message, but appending the real one for clarity
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
});
