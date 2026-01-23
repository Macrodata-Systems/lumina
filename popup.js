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
    
    // Inputs
    const geminiKeyInput = document.getElementById('gemini-key');
    const openaiKeyInput = document.getElementById('openai-key');
    const anthropicKeyInput = document.getElementById('anthropic-key');

    // Load Settings
    chrome.storage.local.get(['geminiKey', 'openaiKey', 'anthropicKey'], (result) => {
        if (result.geminiKey) geminiKeyInput.value = result.geminiKey;
        if (result.openaiKey) openaiKeyInput.value = result.openaiKey;
        if (result.anthropicKey) anthropicKeyInput.value = result.anthropicKey;
    });

    // Navigation
    settingsBtn.addEventListener('click', () => {
        mainView.classList.add('hidden');
        settingsView.classList.remove('hidden');
        settingsBtn.classList.add('hidden');
    });

    backBtn.addEventListener('click', () => {
        settingsView.classList.add('hidden');
        mainView.classList.remove('hidden');
        settingsBtn.classList.remove('hidden');
    });

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
            console.error(err);
            updateSection('gemini-section', 'Error capturing tab: ' + err.message);
        }
    };

    // Trigger on load if we are in main view (settings hidden)
    if (settingsView.classList.contains('hidden')) {
        // slight delay to ensure render
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
            chrome.tabs.captureVisibleTab(null, {format: 'jpeg', quality: 80}, (dataUrl) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(dataUrl);
                }
            });
        });
    }
});
