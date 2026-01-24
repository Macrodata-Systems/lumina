/*
 * Lumina - AI Browser Extension
 * Copyright (c) 2026 Harsh Raj Singh. All Rights Reserved.
 *
 * This code is proprietary. Unauthorized copying of this file, via any medium is strictly prohibited.
 */

import { API_CONFIG } from './config.js';
import { callGemini } from './services/gemini.js';
import { callOpenAI } from './services/openai.js';
import { callAnthropic } from './services/anthropic.js';
import { callDeepSeek } from './services/deepseek.js';
import { verifyGumroadLicense } from './services/license.js';

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
    const grokKeyInput = document.getElementById('grok-key');
    const deepseekKeyInput = document.getElementById('deepseek-key');
    const licenseKeyInput = document.getElementById('license-key');

    // Load Settings & Theme
    chrome.storage.local.get(['geminiKey', 'openaiKey', 'anthropicKey', 'grokKey', 'deepseekKey', 'theme', 'licenseKey', 'licenseValid', 'history'], (result) => {
        if (result.geminiKey) geminiKeyInput.value = result.geminiKey;
        if (result.openaiKey) openaiKeyInput.value = result.openaiKey;
        if (result.anthropicKey) anthropicKeyInput.value = result.anthropicKey;
        if (result.grokKey) grokKeyInput.value = result.grokKey;
        if (result.deepseekKey) deepseekKeyInput.value = result.deepseekKey;
        if (result.licenseKey) licenseKeyInput.value = result.licenseKey;

        window.isLicenseValid = result.licenseValid || false;

        // Initialize history
        window.historyData = result.history || [];

        // Apply saved theme or default to light
        const currentTheme = result.theme || 'dark';
        applyTheme(currentTheme);

        // Initial UI Update based on license
        updateProSettingsVisibility();
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

        updateProSettingsVisibility();
    }

    function updateProSettingsVisibility() {
        const proSettings = document.getElementById('pro-model-settings');
        if (isPro()) {
            proSettings.classList.remove('hidden');
        } else {
            proSettings.classList.add('hidden');
        }
    }

    // Save Settings
    // Save Settings
    saveSettingsBtn.addEventListener('click', async () => {
        saveSettingsBtn.textContent = 'Verifying...';

        const licenseKey = licenseKeyInput.value.trim();
        let licenseValid = false;

        if (licenseKey) {
            const verification = await verifyGumroadLicense(licenseKey);
            if (verification.valid) {
                licenseValid = true;
            } else {
                alert(`License Verification Failed: ${verification.message}`);
                // Proceed to save but mark invalid
            }
        }

        window.isLicenseValid = licenseValid;

        const keys = {
            geminiKey: geminiKeyInput.value.trim(),
            openaiKey: openaiKeyInput.value.trim(),
            anthropicKey: anthropicKeyInput.value.trim(),
            grokKey: grokKeyInput.value.trim(),
            deepseekKey: deepseekKeyInput.value.trim(),
            licenseKey: licenseKey,
            licenseValid: licenseValid
        };

        chrome.storage.local.set(keys, () => {
            saveSettingsBtn.textContent = 'Save';
            updateProSettingsVisibility();

            if (licenseValid) {
                alert('Settings Saved. Pro Features Unlocked! 🚀');
            } else {
                alert('Settings Saved.');
            }
            backBtn.click();
        });
    });

    // Tab Logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    const resultSections = document.querySelectorAll('.result-section');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-tab');
            switchTab(targetId);
        });
    });


    function switchTab(tabId) {
        // specific tab button
        tabBtns.forEach(btn => {
            if (btn.getAttribute('data-tab') === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // specific section
        resultSections.forEach(sec => {
            if (sec.id === tabId) {
                sec.classList.add('active-section');
            } else {
                sec.classList.remove('active-section');
            }
        });

        if (tabId === 'history-section') {
            renderHistory();
        }
    }

    // Prompt Logic
    const promptInput = document.getElementById('custom-prompt');
    const chips = document.querySelectorAll('.chip');



    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            promptInput.value = chip.getAttribute('data-prompt');
            startExplanation();
        });
    });

    promptInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            startExplanation();
        }
    });

    // Refresh Buttons Logic
    document.querySelectorAll('.refresh-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent collapsing if we were in a specialized header
            const target = btn.getAttribute('data-target');
            if (target) {
                startExplanation([target]);
            }
        });
    });



    // Super Prompt Bar Logic
    let useScreenshot = false;
    let usePageText = true; // Default

    const toggleScreenshotBtn = document.getElementById('toggle-screenshot');
    const togglePageTextBtn = document.getElementById('toggle-pagetext');
    const micBtn = document.getElementById('mic-btn');
    const loadTextBtn = document.getElementById('load-text-btn');
    const sendBtn = document.getElementById('send-btn');

    // Init Toggles (Sync with HTML)
    const updateToggleUI = () => {
        toggleScreenshotBtn.classList.toggle('active', useScreenshot);
        togglePageTextBtn.classList.toggle('active', usePageText);
    };
    updateToggleUI();

    toggleScreenshotBtn.addEventListener('click', () => {
        useScreenshot = !useScreenshot;
        updateToggleUI();
    });

    togglePageTextBtn.addEventListener('click', () => {
        usePageText = !usePageText;
        updateToggleUI();
    });

    // Audio Input (Web Speech API)
    if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        micBtn.addEventListener('click', () => {
            if (micBtn.classList.contains('listening')) {
                recognition.stop();
            } else {
                recognition.start();
                micBtn.classList.add('listening');
            }
        });

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            promptInput.value += (promptInput.value ? " " : "") + transcript;
            micBtn.classList.remove('listening');
        };

        recognition.onerror = (event) => {
            console.error("Speech Error:", event.error);
            micBtn.classList.remove('listening');

            if (event.error === 'not-allowed' || event.error === 'permission-denied') {
                alert("Microphone access blocked. Please go to extension settings (chrome://extensions), find Lumina, and ensure microphone permission is allowed, or check your OS settings.");
            } else if (event.error === 'no-speech') {
                // Ignore, just stopped listening
            } else {
                alert("Voice input error: " + event.error);
            }
        };

        recognition.onend = () => {
            micBtn.classList.remove('listening');
        };
    } else {
        micBtn.style.display = 'none'; // Hide if not supported
    }

    // Load Text logic
    loadTextBtn.addEventListener('click', async () => {
        loadTextBtn.style.opacity = '0.5';
        const text = await scrapePageText();
        if (text) {
            // promptInput.value += "\n\n" + text; // Append or Replace? User asked to "load it on the prompt box"
            // Usually replacing or filling is better context. Let's append if exists.
            promptInput.value = text; // "load it on the prompt box" implies populating it
            loadTextBtn.style.color = 'var(--primary-color)';
            setTimeout(() => {
                loadTextBtn.style.color = '';
                loadTextBtn.style.opacity = '1';
            }, 1000);
        } else {
            alert("Could not extract text.");
            loadTextBtn.style.opacity = '1';
        }
    });

    // Send Button
    sendBtn.addEventListener('click', () => startExplanation());


    // Auto-Explain Logic
    // targetServices: array of strings ['gemini', 'openai', 'anthropic', 'deepseek'] or null (for all)
    const startExplanation = async (targetServices = null) => {
        // useScreenshot and usePageText are now global module vars updated by buttons

        if (!useScreenshot && !usePageText) {
            updateSection('gemini-section', 'Please select at least one source (Screenshot or Page Text).');
            return;
        }

        const resultsContainer = document.getElementById('results-container');
        resultsContainer.classList.remove('hidden');
        explainBtn.classList.add('hidden');

        // Only show loading for targets
        if (!targetServices || targetServices.includes('gemini')) updateSection('gemini-section', 'Loading...');
        if (!targetServices || targetServices.includes('openai')) updateSection('openai-section', 'Loading...');
        if (!targetServices || targetServices.includes('anthropic')) updateSection('anthropic-section', 'Loading...');
        if (!targetServices || targetServices.includes('grok')) updateSection('grok-section', 'Loading...');
        if (!targetServices || targetServices.includes('deepseek')) updateSection('deepseek-section', 'Loading...');

        const promptInputVal = promptInput.value.trim() || "";

        // Prepare variables to be cleared
        let screenshotUrl = null;
        let pageText = null;

        try {
            // Parallel Capture based on selection
            const promises = [];
            if (useScreenshot) promises.push(captureTab()); else promises.push(Promise.resolve(null));
            if (usePageText) promises.push(scrapePageText()); else promises.push(Promise.resolve(""));

            const [capturedUrl, capturedText] = await Promise.all(promises);

            screenshotUrl = capturedUrl;
            pageText = capturedText;

            // Construct context-rich prompt
            let finalPrompt = "";
            let promptDisplay = ""; // For the UI view

            if (promptInputVal) {
                finalPrompt = `Instruction: ${promptInputVal}`;
                promptDisplay = `Instruction: ${promptInputVal}`;
            } else {
                finalPrompt = `Explain this page.`;
                promptDisplay = `Explain this page.`;
            }

            if (pageText) {
                finalPrompt += `\n\nContext from Page Text:\n${pageText.substring(0, 3000)}...`;
                promptDisplay += `\n\n[Attached Page Text: ${pageText.length} chars (truncated in view)]`;
            }

            if (screenshotUrl) {
                promptDisplay += `\n[Attached Screenshot: Yes]`;
            } else {
                promptDisplay += `\n[Attached Screenshot: No]`;
            }

            // Update Query View
            document.getElementById('query-content').textContent = promptDisplay;

            // Fetch keys using await (Promise-based in MV3)
            const storageKeys = await chrome.storage.local.get(['geminiKey', 'openaiKey', 'anthropicKey', 'grokKey', 'deepseekKey']);

            // Merge storage keys with hardcoded config keys (Storage takes precedence if user set one, otherwise Config)
            // OR user might want Config to override? Usually Hardcode = Default.
            // Let's allow Storage to override so the user can still change it in UI if they want, 
            // but default to Config if Storage is empty.
            const keys = {
                geminiKey: storageKeys.geminiKey || API_CONFIG.geminiKey,
                openaiKey: storageKeys.openaiKey || API_CONFIG.openaiKey,
                anthropicKey: storageKeys.anthropicKey || API_CONFIG.anthropicKey,
                grokKey: storageKeys.grokKey || API_CONFIG.grokKey,
                deepseekKey: storageKeys.deepseekKey || API_CONFIG.deepseekKey
            };

            // Trigger explanations (Fire and forget, don't await completion to keep UI parallel)
            if ((!targetServices || targetServices.includes('gemini'))) {
                if (keys.geminiKey) {
                    callGemini(keys.geminiKey, screenshotUrl, finalPrompt)
                        .then(text => {
                            updateSection('gemini-section', classFormatMarkdown(text));
                            saveToHistory(finalPrompt, text, 'Gemini');
                        })
                        .catch(err => updateSection('gemini-section', 'Error: ' + err.message));
                } else {
                    updateSection('gemini-section', 'API Key not configured.');
                }
            }

            if ((!targetServices || targetServices.includes('openai'))) {
                if (!isPro()) {
                    updateSection('openai-section', getLockOverlayHTML('ChatGPT 4o'));
                } else if (keys.openaiKey) {
                    callOpenAI(keys.openaiKey, screenshotUrl, finalPrompt)
                        .then(text => {
                            updateSection('openai-section', classFormatMarkdown(text));
                            saveToHistory(finalPrompt, text, 'ChatGPT');
                        })
                        .catch(err => updateSection('openai-section', 'Error: ' + err.message));
                } else {
                    updateSection('openai-section', 'API Key not configured.');
                }
            }

            if ((!targetServices || targetServices.includes('anthropic'))) {
                if (!isPro()) {
                    updateSection('anthropic-section', getLockOverlayHTML('Claude 3.5 Sonnet'));
                } else if (keys.anthropicKey) {
                    callAnthropic(keys.anthropicKey, screenshotUrl, finalPrompt)
                        .then(text => {
                            updateSection('anthropic-section', classFormatMarkdown(text));
                            saveToHistory(finalPrompt, text, 'Claude');
                        })
                        .catch(err => updateSection('anthropic-section', 'Error: ' + err.message));
                } else {
                    updateSection('anthropic-section', 'API Key not configured.');
                }
            }

            if ((!targetServices || targetServices.includes('grok'))) {
                if (!isPro()) {
                    updateSection('grok-section', getLockOverlayHTML('Grok AI'));
                } else if (keys.grokKey) {
                    // Placeholder for Grok - API integration to be added
                    updateSection('grok-section', 'Grok API integration coming soon. Please configure your API key in settings.');
                } else {
                    updateSection('grok-section', 'API Key not configured.');
                }
            }

            if ((!targetServices || targetServices.includes('deepseek'))) {
                if (!isPro()) {
                    updateSection('deepseek-section', getLockOverlayHTML('DeepSeek R1'));
                } else if (keys.deepseekKey) {
                    // Streaming implementation for DeepSeek
                    callDeepSeek(keys.deepseekKey, screenshotUrl, finalPrompt, (partial) => {
                        const { reasoning, content } = partial;

                        // Preserve detail state if it exists
                        const existingDetails = document.querySelector('#deepseek-section details');
                        const wasOpen = existingDetails ? existingDetails.hasAttribute('open') : true; // Default to open while streaming

                        const answerHtml = classFormatMarkdown(content);
                        let finalHtml = answerHtml;

                        if (reasoning) {
                            const reasoningHtml = `
                                <div class="reasoning-container">
                                    <details ${wasOpen ? 'open' : ''}>
                                        <summary>🦈 DeepSeek Thought Process</summary>
                                        <div class="reasoning-content">${reasoning.replace(/\n/g, '<br>')}</div>
                                    </details>
                                </div>
                            `;
                            finalHtml = reasoningHtml + answerHtml;
                        }

                        updateSection('deepseek-section', finalHtml);
                    })
                        .then(finalResult => {
                            // Final render to ensure everything is clean (callback covers it, but good for safety)
                            // We don't strictly need to do anything here if the callback was exhaustive,
                            // but we might want to ensure 'Loading...' is cleared if empty.
                            if (!finalResult.content && !finalResult.reasoning) {
                                updateSection('deepseek-section', 'No content returned.');
                            } else {
                                saveToHistory(finalPrompt, finalResult.content, 'DeepSeek');
                            }
                        })
                        .catch(err => updateSection('deepseek-section', 'Error: ' + err.message));
                } else {
                    updateSection('deepseek-section', 'API Key not configured.');
                }
            }

        } catch (err) {
            console.error(err); // Log detailed error
            let msg = err.message;
            if (msg.includes("Cannot capture")) msg = "Could not capture page. Try reloading.";

            // Show error in all active targets if they are still "Loading..."
            if (!targetServices || targetServices.includes('gemini')) {
                const el = document.querySelector('#gemini-section .content');
                if (el && el.textContent === 'Loading...') updateSection('gemini-section', 'Error: ' + msg);
            }
            if (!targetServices || targetServices.includes('deepseek')) {
                const el = document.querySelector('#deepseek-section .content');
                // For deepseek, if we already streamed something, maybe don't overwrite with error? 
                // But if error is fatal, we should.
                updateSection('deepseek-section', 'Error: ' + msg);
            }
        } finally {
            // Auto-cleanup memory
            screenshotUrl = null;
            pageText = null;
        }
    };

    async function scrapePageText() {
        return new Promise((resolve) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (!tabs || tabs.length === 0) return resolve("");
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: () => document.body.innerText
                }, (results) => {
                    if (chrome.runtime.lastError || !results || !results[0]) {
                        resolve(""); // Fail silently or return empty text
                    } else {
                        resolve(results[0].result || "");
                    }
                });
            });
        });
    }

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
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (!tabs || tabs.length === 0) {
                    reject(new Error("No active tab found."));
                    return;
                }
                const activeTab = tabs[0];
                const windowId = activeTab.windowId;

                chrome.tabs.captureVisibleTab(windowId, { format: 'jpeg', quality: 80 }, (dataUrl) => {
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
    /* History & License Logic */

    function isPro() {
        if (API_CONFIG.developerMode) return true;
        if (window.isLicenseValid) return true;

        const key = licenseKeyInput.value.trim();
        return key.startsWith('TEST'); // Only TEST keys bypass without server verification now
    }

    function saveToHistory(prompt, response, service) {
        if (!prompt || !response) return;

        const newItem = {
            id: Date.now(),
            date: new Date().toISOString(),
            prompt: prompt,
            response: response,
            service: service
        };

        // Add to local array
        window.historyData = [newItem, ...(window.historyData || [])];

        // Limit to 50 items
        if (window.historyData.length > 50) {
            window.historyData = window.historyData.slice(0, 50);
        }

        chrome.storage.local.set({ history: window.historyData });
    }

    function renderHistory() {
        const container = document.querySelector('.history-list-container');
        const historySection = document.getElementById('history-section');

        // Remove existing overlay if any
        const existingOverlay = historySection.querySelector('.pro-overlay');
        if (existingOverlay) existingOverlay.remove();

        if (!isPro()) {
            // Append new overlay
            historySection.insertAdjacentHTML('beforeend', getLockOverlayHTML('Unlimited History'));
            // Render blurred items
            renderHistoryItems(container, window.historyData || [], true);
            return;
        }

        renderHistoryItems(container, window.historyData || []);
    }

    function renderHistoryItems(container, items, blur = false) {
        container.innerHTML = '';
        if (!items || items.length === 0) {
            container.innerHTML = '<div class="empty-state">No history yet. Start explaining things!</div>';
            return;
        }

        items.forEach(item => {
            const dateStr = new Date(item.date).toLocaleString();
            const el = document.createElement('div');
            el.className = 'history-item';
            el.innerHTML = `
                <div class="history-date">${dateStr} • ${item.service}</div>
                <div class="history-prompt">${item.prompt.replace(/Instruction: /, "").replace(/Instruction: /, "")}</div>
                <div class="history-preview">${item.response.substring(0, 150)}...</div>
            `;

            el.addEventListener('click', () => {
                if (!isPro()) return;
                // Load into view
                const tabId = item.service.toLowerCase() + '-section';
                // Map service name to section ID if needed (ChatGPT -> openai)
                let sectionId = tabId;
                if (item.service === 'ChatGPT') sectionId = 'openai-section';
                if (item.service === 'Claude') sectionId = 'anthropic-section';
                if (item.service === 'Gemini') sectionId = 'gemini-section';
                if (item.service === 'Grok') sectionId = 'grok-section';
                if (item.service === 'DeepSeek') sectionId = 'deepseek-section';

                switchTab(sectionId);
                updateSection(sectionId, classFormatMarkdown(item.response));
            });

            container.appendChild(el);
        });
    }

    // "Get Pro" link
    document.getElementById('buy-license-link').addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://gumroad.com/l/lumina-pro-demo' });
    });

    // Delegation for dynamic unlock buttons
    document.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('unlock-btn')) {
            openSettings('license-key');
        }

        // Handle pro modal close button - switch to Gemini (safe fallback)
        if (e.target && e.target.classList.contains('pro-close-btn')) {
            switchTab('gemini-section');
        }
    });

    document.getElementById('clear-history-btn').addEventListener('click', () => {
        if (confirm('Clear all history?')) {
            window.historyData = [];
            chrome.storage.local.set({ history: [] });
            renderHistory();
        }
    });

    // Delegated click for paste buttons
    document.addEventListener('click', async (e) => {
        if (e.target && e.target.classList.contains('paste-btn')) {
            try {
                const text = await navigator.clipboard.readText();
                if (text) {
                    const targetId = e.target.getAttribute('data-target');
                    const input = document.getElementById(targetId);
                    if (input) {
                        input.value = text;
                        // Visual feedback
                        const originalText = e.target.textContent;
                        e.target.textContent = 'Pasted!';
                        setTimeout(() => e.target.textContent = originalText, 1000);
                    }
                }
            } catch (err) {
                console.error('Failed to read clipboard', err);
                alert('Could not paste. Please paste manually.');
            }
        }
    });
});

function getLockOverlayHTML(featureName) {
    return `
    <div class="pro-overlay">
        <button class="pro-close-btn" title="Go Back">✕</button>
        <div class="pro-lock-content">
            <span class="lock-icon">🔒</span>
            <h3>Lumina Pro</h3>
            <p>Upgrade to unlock ${featureName} and more.</p>
            <button class="primary-btn unlock-btn">Unlock Now</button>
        </div>
    </div>
    `;
}
