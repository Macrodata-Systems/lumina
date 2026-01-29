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
import { callGrok } from './services/xai.js';
// License import removed for lightweight build

// --- AI Model Configuration ---
// --- AI Model Configuration ---
const AI_MODELS = {
    gemini: {
        displayName: 'Gemini',
        providerName: 'Google',
        iconClass: 'fa-brands fa-google',
        keyUrl: 'https://aistudio.google.com/apikey',
        keyStorageName: 'geminiKey',
        sectionId: 'gemini-section',
        instructions: [
            '<strong>Step 1:</strong> Click the button above to visit <strong>Google AI Studio</strong>.',
            '<strong>Step 2:</strong> Sign in with your Google Account.',
            '<strong>Step 3:</strong> Click <strong>"Get API Key"</strong> in the left sidebar.',
            '<strong>Step 4:</strong> Click <strong>"Create API key"</strong> and select a project.',
            '<strong>Step 5:</strong> Copy your new API key and paste it into the field below.'
        ]
    },
    openai: {
        displayName: 'ChatGPT',
        providerName: 'OpenAI',
        iconClass: 'fa-solid fa-bolt',
        keyUrl: 'https://platform.openai.com/api-keys',
        keyStorageName: 'openaiKey',
        sectionId: 'openai-section',
        instructions: [
            '<strong>Step 1:</strong> Click the button above to open the <strong>OpenAI Dashboard</strong>.',
            '<strong>Step 2:</strong> Log in and go to the <strong>"API Keys"</strong> page.',
            '<strong>Step 3:</strong> Click <strong>"+ Create new secret key"</strong>.',
            '<strong>Step 4:</strong> Name your key and <strong>copy it immediately</strong> (it won\'t be shown again!).',
            '<strong>Step 5:</strong> Paste the key into the input field below.'
        ]
    },
    anthropic: {
        displayName: 'Claude',
        providerName: 'Anthropic',
        iconClass: 'fa-solid fa-brain',
        keyUrl: 'https://console.anthropic.com/settings/keys',
        keyStorageName: 'anthropicKey',
        sectionId: 'anthropic-section',
        instructions: [
            '<strong>Step 1:</strong> Click the button above to open the <strong>Anthropic Console</strong>.',
            '<strong>Step 2:</strong> Sign in and navigate to <strong>"Settings"</strong> → <strong>"API Keys"</strong>.',
            '<strong>Step 3:</strong> Click <strong>"Create Key"</strong> and give it a name.',
            '<strong>Step 4:</strong> Copy the secret key and paste it below to enable Claude.'
        ]
    },
    grok: {
        displayName: 'Grok',
        providerName: 'xAI',
        iconClass: 'fa-brands fa-x-twitter',
        keyUrl: 'https://console.x.ai',
        keyStorageName: 'grokKey',
        sectionId: 'grok-section',
        instructions: [
            '<strong>Step 1:</strong> Click the button above to visit the <strong>xAI Console</strong>.',
            '<strong>Step 2:</strong> Log in with your X (Twitter) account.',
            '<strong>Step 3:</strong> Navigate to the <strong>"API Keys"</strong> section in the sidebar.',
            '<strong>Step 4:</strong> Click <strong>"Create API Key"</strong> and copy the code.',
            '<strong>Step 5:</strong> Paste it below to unlock Grok.'
        ]
    },
    deepseek: {
        displayName: 'DeepSeek',
        providerName: 'DeepSeek',
        iconClass: 'fa-solid fa-code',
        keyUrl: 'https://platform.deepseek.com/api_keys',
        keyStorageName: 'deepseekKey',
        sectionId: 'deepseek-section',
        instructions: [
            '<strong>Step 1:</strong> Click the button above to open the <strong>DeepSeek Platform</strong>.',
            '<strong>Step 2:</strong> Sign in and navigate to the <strong>"API Keys"</strong> section.',
            '<strong>Step 3:</strong> Click <strong>"Create API Key"</strong> and copy the generated key.',
            '<strong>Step 4:</strong> Paste it into the input field below to start talking.'
        ]
    }
};

// Helper Map for Key Lookups
const modelKeyMap = {
    'gemini-section': 'geminiKey',
    'openai-section': 'openaiKey',
    'anthropic-section': 'anthropicKey',
    'grok-section': 'grokKey',
    'deepseek-section': 'deepseekKey'
};

// --- SESSION EXPIRY MANAGEMENT ---
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Update last activity timestamp
function updateLastActivity() {
    chrome.storage.local.set({ lastActivity: Date.now() });
}

// Check if session has expired and clear data if needed
function checkSessionExpiry() {
    chrome.storage.local.get(['lastActivity'], (result) => {
        const lastActivity = result.lastActivity || 0;
        const now = Date.now();

        if (lastActivity > 0 && now - lastActivity > SESSION_TIMEOUT) {
            clearExpiredSessionData();
        }
    });
}

// Clear all storage except API keys
function clearExpiredSessionData() {
    chrome.storage.local.get(null, (allData) => {
        // Extract only the API keys
        const keysToKeep = {
            geminiKey: allData.geminiKey || '',
            openaiKey: allData.openaiKey || '',
            anthropicKey: allData.anthropicKey || '',
            grokKey: allData.grokKey || '',
            deepseekKey: allData.deepseekKey || ''
        };

        // Clear ALL storage
        chrome.storage.local.clear(() => {
            // Restore only the API keys
            chrome.storage.local.set(keysToKeep, () => {
                // Clear in-memory conversation history
                for (let service in conversationHistory) {
                    conversationHistory[service] = [];
                }

                // Update UI to show clean state
                const allSections = document.querySelectorAll('.content');
                allSections.forEach(section => {
                    section.innerHTML = `
                        <div class="empty-state">
                            <div style="font-size: 2rem; margin-bottom: 10px;">✨</div>
                            <p><strong>Session expired</strong></p>
                            <p style="font-size: 0.9rem; opacity: 0.8;">Your data has been cleared for privacy. API keys preserved.</p>
                        </div>
                    `;
                });
            });
        });
    });
}

// --- Conversation History for Guided Learning ---
const conversationHistory = {
    gemini: [],
    openai: [],
    anthropic: [],
    grok: [],
    deepseek: []
};


// --- DEBUG TOAST SYSTEM ---
function debugToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'debug-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    // Trigger reflow
    void toast.offsetWidth;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// --- GLOBAL UI LOCKS ---
window.uiLocks = {};

// -- Global State --
let useScreenshot = false;
let usePageText = true; // Default


// --- Helper for Pro Checks ---
function isPro() {
    return true;
}

// Auto-Explain Logic
document.addEventListener('DOMContentLoaded', () => {

    // Function declaration is hoisted!
    async function startExplanation(targetServices = null) {
        // Update session activity
        updateLastActivity();

        // useScreenshot and usePageText are now global module vars updated by buttons

        if (!useScreenshot && !usePageText) {
            updateSection('gemini-section', 'Please select at least one source (Screenshot or Page Text).');
            return;
        }

        // If no specific target valid, find the ACTIVE tab
        if (!targetServices) {
            const activeTabBtn = document.querySelector('.tab-btn.active');
            if (activeTabBtn) {
                const tabId = activeTabBtn.getAttribute('data-tab'); // e.g. gemini-section
                // Extract service name from id: gemini-section -> gemini
                const serviceName = tabId.replace('-section', '');
                // Special map if needed (ChatGPT -> openai)
                if (serviceName === 'openai') targetServices = ['openai'];
                else if (serviceName === 'anthropic') targetServices = ['anthropic'];
                else if (serviceName === 'gemini') targetServices = ['gemini'];
                else if (serviceName === 'grok') targetServices = ['grok'];
                else if (serviceName === 'deepseek') targetServices = ['deepseek'];
                else targetServices = ['gemini']; // Fallback
            } else {
                targetServices = ['gemini']; // Default fallback
            }
        }

        // Fetch keys using await (Promise-based in MV3)
        const storageKeys = await chrome.storage.local.get(['geminiKey', 'openaiKey', 'anthropicKey', 'grokKey', 'deepseekKey']);

        const keys = {
            geminiKey: storageKeys.geminiKey || API_CONFIG.geminiKey,
            openaiKey: storageKeys.openaiKey || API_CONFIG.openaiKey,
            anthropicKey: storageKeys.anthropicKey || API_CONFIG.anthropicKey,
            grokKey: storageKeys.grokKey || API_CONFIG.grokKey,
            deepseekKey: storageKeys.deepseekKey || API_CONFIG.deepseekKey
        };

        const resultsContainer = document.getElementById('results-container');
        resultsContainer.classList.remove('hidden');
        // explainBtn.classList.add('hidden'); // REMOVED: Element might not likely exist or is managed elsewhere

        // Only show loading for targets IF they have keys
        targetServices.forEach(srv => {
            const requiredKeyName = modelKeyMap[`${srv}-section`];
            const hasKey = keys[requiredKeyName];

            // ...

            if (hasKey) {
                updateSection(`${srv}-section`, 'Loading...');
            } else {
                // No Key? Show Auth Card immediately (but only if not already shown)
                const section = document.getElementById(`${srv}-section`);
                if (section) {
                    const contentDiv = section.querySelector('.content');
                    const existingAuthCard = contentDiv?.querySelector('.auth-card');

                    if (!existingAuthCard) {
                        renderAuthCard(section, `${srv}-section`, requiredKeyName);
                    }
                    // If auth card already exists, preserve its state
                }
            }
        });

        const promptInput = document.getElementById('main-chat-input');
        const promptInputVal = promptInput ? promptInput.value.trim() : "";

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
                // Metadata hidden from user bubble per request
                // promptDisplay += `\n\n[Attached Page Text: ${pageText.length} chars (truncated in view)]`;
            }

            if (screenshotUrl) {
                // Metadata hidden from user bubble per request
                // promptDisplay += `\n[Attached Screenshot: Yes]`;
            } else {
                // Metadata hidden from user bubble per request
                // promptDisplay += `\n[Attached Screenshot: No]`;
            }

            // Update Query View


            // Fetch keys using await (Promise-based in MV3)
            // const storageKeys = await chrome.storage.local.get(['geminiKey', 'openaiKey', 'anthropicKey', 'grokKey', 'deepseekKey']);

            // Merge storage keys with hardcoded config keys (Storage takes precedence if user set one, otherwise Config)
            // OR user might want Config to override? Usually Hardcode = Default.
            // Let's allow Storage to override so the user can still change it in UI if they want, 
            // but default to Config if Storage is empty.
            // const keys = {
            //     geminiKey: storageKeys.geminiKey || API_CONFIG.geminiKey,
            //     openaiKey: storageKeys.openaiKey || API_CONFIG.openaiKey,
            //     anthropicKey: storageKeys.anthropicKey || API_CONFIG.anthropicKey,
            //     grokKey: storageKeys.grokKey || API_CONFIG.grokKey,
            //     deepseekKey: storageKeys.deepseekKey || API_CONFIG.deepseekKey
            // };

            // Trigger explanations (Fire and forget, don't await completion to keep UI parallel)
            if ((!targetServices || targetServices.includes('gemini'))) {
                if (keys.geminiKey || true) { // Always allow if key exists or for proxy
                    // Update UI immediately with user message + screenshot
                    renderChatMessage('user', promptDisplay, 'gemini-section', screenshotUrl);
                    conversationHistory.gemini.push({ role: 'user', content: finalPrompt });

                    const loadingId = `gemini-loading-${Date.now()}`;
                    renderChatMessage('assistant', 'Loading...', 'gemini-section', null, loadingId);

                    const conversationContext = conversationHistory.gemini.length > 0 ? conversationHistory.gemini : null;

                    const apiKey = keys.geminiKey;
                    const geminiCall = apiKey
                        ? callGemini(apiKey, screenshotUrl, finalPrompt, conversationContext)
                        : callAIProxy('gemini', finalPrompt, screenshotUrl);

                    geminiCall
                        .then(text => {
                            // Clear loading 
                            const loadingEl = document.getElementById(loadingId);
                            if (loadingEl) loadingEl.remove();

                            // Add to conversation history
                            conversationHistory.gemini.push({ role: 'assistant', content: text });

                            // Render as chat
                            renderChatMessage('assistant', text, 'gemini-section');

                            // Setup chat interface (follow-ups handled by triggerFollowUpChat)
                            setupChatInterface('gemini-section');

                            // Save to history
                            saveToHistory(finalPrompt, text, 'Gemini');
                        })
                        .catch(err => {
                            const loadingEl = document.getElementById(loadingId);
                            if (loadingEl) loadingEl.remove();
                            handleApiError(err, 'gemini-section', 'geminiKey');
                        });
                }
                else {
                    // The UI already rendered an Auth Card for Gemini if the key was missing.
                }
            }

            if ((!targetServices || targetServices.includes('openai'))) {
                if (keys.openaiKey) {
                    // Update UI immediately
                    renderChatMessage('user', promptDisplay, 'openai-section', screenshotUrl);
                    conversationHistory.openai.push({ role: 'user', content: finalPrompt });

                    const loadingId = `openai-loading-${Date.now()}`;
                    renderChatMessage('assistant', 'Loading...', 'openai-section', null, loadingId);

                    const conversationContext = conversationHistory.openai.length > 0 ? conversationHistory.openai : null;

                    callOpenAI(keys.openaiKey, screenshotUrl, finalPrompt, conversationContext)
                        .then(text => {
                            const loadingEl = document.getElementById(loadingId);
                            if (loadingEl) loadingEl.remove();

                            // Add to conversation history
                            conversationHistory.openai.push({ role: 'assistant', content: text });

                            // Render as chat
                            renderChatMessage('assistant', text, 'openai-section');

                            // Setup chat interface (follow-ups handled by triggerFollowUpChat)
                            setupChatInterface('openai-section');

                            // Save to history
                            saveToHistory(finalPrompt, text, 'ChatGPT');
                        })
                        .catch(err => {
                            const loadingEl = document.getElementById(loadingId);
                            if (loadingEl) loadingEl.remove();
                            handleApiError(err, 'openai-section', 'openaiKey');
                        });
                }
            }

            if ((!targetServices || targetServices.includes('anthropic'))) {
                if (keys.anthropicKey) {
                    // Update UI immediately
                    renderChatMessage('user', promptDisplay, 'anthropic-section', screenshotUrl);
                    conversationHistory.anthropic.push({ role: 'user', content: finalPrompt });

                    const loadingId = `anthropic-loading-${Date.now()}`;
                    renderChatMessage('assistant', 'Loading...', 'anthropic-section', null, loadingId);

                    const conversationContext = conversationHistory.anthropic.length > 0 ? conversationHistory.anthropic : null;

                    callAnthropic(keys.anthropicKey, screenshotUrl, finalPrompt, conversationContext)
                        .then(text => {
                            const loadingEl = document.getElementById(loadingId);
                            if (loadingEl) loadingEl.remove();

                            // Add to conversation history
                            conversationHistory.anthropic.push({ role: 'assistant', content: text });

                            // Render as chat
                            renderChatMessage('assistant', text, 'anthropic-section');

                            // Setup chat interface (follow-ups handled by triggerFollowUpChat)
                            setupChatInterface('anthropic-section');

                            // Save to history
                            saveToHistory(finalPrompt, text, 'Claude');
                        })
                        .catch(err => {
                            const loadingEl = document.getElementById(loadingId);
                            if (loadingEl) loadingEl.remove();
                            handleApiError(err, 'anthropic-section', 'anthropicKey');
                        });
                }
            }

            if ((!targetServices || targetServices.includes('grok'))) {
                if (keys.grokKey) {
                    // Update UI immediately
                    renderChatMessage('user', promptDisplay, 'grok-section', screenshotUrl);
                    conversationHistory.grok.push({ role: 'user', content: finalPrompt });

                    const loadingId = `grok-loading-${Date.now()}`;
                    renderChatMessage('assistant', 'Loading...', 'grok-section', null, loadingId);

                    callGrok(keys.grokKey, screenshotUrl, finalPrompt, conversationHistory.grok)
                        .then(text => {
                            const loadingEl = document.getElementById(loadingId);
                            if (loadingEl) loadingEl.remove();

                            // Add to conversation history
                            conversationHistory.grok.push({ role: 'assistant', content: text });

                            // Render as chat
                            renderChatMessage('assistant', text, 'grok-section');

                            // Setup chat interface (follow-ups handled by triggerFollowUpChat)
                            setupChatInterface('grok-section');

                            // Save to history
                            saveToHistory(finalPrompt, text, 'Grok');
                        })
                        .catch(err => {
                            const loadingEl = document.getElementById(loadingId);
                            if (loadingEl) loadingEl.remove();
                            handleApiError(err, 'grok-section', 'grokKey');
                        });
                }
            }
            if ((!targetServices || targetServices.includes('deepseek'))) {
                if (keys.deepseekKey) {
                    // Update UI immediately
                    renderChatMessage('user', promptDisplay, 'deepseek-section', screenshotUrl);
                    conversationHistory.deepseek.push({ role: 'user', content: finalPrompt });

                    // Create a placeholder for the streaming response
                    const streamingMsgId = `deepseek-streaming-${Date.now()}`;
                    renderChatMessage('assistant', 'Loading...', 'deepseek-section', null, streamingMsgId);

                    // Streaming implementation for DeepSeek
                    callDeepSeek(keys.deepseekKey, screenshotUrl, finalPrompt, (partial) => {
                        const { reasoning, content } = partial;

                        // Preserve detail state if it exists
                        const existingDetails = document.getElementById(streamingMsgId)?.querySelector('details');
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

                        // Update the existing streaming message instead of replacing entire section
                        const msgBubble = document.getElementById(streamingMsgId)?.querySelector('.message-bubble');
                        if (msgBubble) {
                            msgBubble.innerHTML = finalHtml;
                            // Auto-scroll
                            msgBubble.scrollIntoView({ behavior: 'auto', block: 'end' });
                        }
                    })
                        .then(finalResult => {
                            if (!finalResult.content && !finalResult.reasoning) {
                                renderChatMessage('assistant', 'No content returned.', 'deepseek-section', null, streamingMsgId);
                            } else {
                                // Add to conversation history (for follow-up chats)
                                conversationHistory.deepseek.push({ role: 'assistant', content: finalResult.content });

                                // Setup chat interface (follow-ups handled by triggerFollowUpChat)
                                setupChatInterface('deepseek-section');

                                // Save to history
                                saveToHistory(finalPrompt, finalResult.content, 'DeepSeek');
                            }
                        })
                        .catch(err => handleApiError(err, 'deepseek-section', 'deepseekKey'));
                }
            }
        } catch (err) {
            console.error(err); // Log detailed error
            let msg = err.message;
            if (msg.includes("Cannot capture")) msg = "Could not capture page. Try reloading.";

            // Show error in all active targets if they are still "Loading..."
            if (!targetServices || targetServices.includes('gemini')) {
                const el = document.querySelector('#gemini-section .content');
                if (el && (el.textContent === 'Loading...' || el.innerHTML === 'Loading...')) updateSection('gemini-section', formatErrorMessage(msg));
            }
            if (!targetServices || targetServices.includes('deepseek')) {
                const el = document.querySelector('#deepseek-section .content');
                if (el && (el.textContent === 'Loading...' || el.innerHTML === 'Loading...')) updateSection('deepseek-section', formatErrorMessage(msg));
            }
        } finally {
            // Auto-cleanup memory
            screenshotUrl = null;
            pageText = null;
        }
    }


    // Handle messages from content script (when sidepanel is ALREADY open)
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'explainText') {
            const input = document.getElementById('main-chat-input');
            if (input) {
                const query = `Explain "${message.text}" in reference to the page content.`;
                input.value = query;

                // Auto-Press Enter (Trigger Send)
                const activeSec = document.querySelector('.active-section');
                if (activeSec) {
                    const service = activeSec.id.replace('-section', '');
                    triggerFollowUpChat(service, query);
                    setTimeout(() => input.value = '', 100);
                }
            }
        }

    });

    // Check for expired session and update activity
    checkSessionExpiry();
    updateLastActivity();

    debugToast('Extension Initialized. Checking Storage...');
    const settingsBtn = document.getElementById('settings-btn');
    const mainView = document.getElementById('main-view');
    const settingsView = document.getElementById('settings-view');
    const backBtn = document.getElementById('back-btn');
    const saveSettingsBtn = document.getElementById('save-settings-btn');

    // Define Global Elements EARLY
    const tabBtns = document.querySelectorAll('.tab-btn');
    const resultSections = document.querySelectorAll('.result-section');

    const explainBtn = document.getElementById('explain-btn');

    // Onboarding Elements
    const setupView = document.getElementById('setup-view');
    const onboardingView = document.getElementById('onboarding-view');
    const startOnboardingBtn = document.getElementById('start-onboarding-btn');
    const setupGeminiInput = document.getElementById('setup-gemini-key');
    const setupOpenaiInput = document.getElementById('setup-openai-key');
    const finishSetupBtn = document.getElementById('finish-setup-btn');

    const themeToggleBtn = document.getElementById('theme-toggle');
    const autoSummarizeToggle = document.getElementById('auto-summarize-toggle');

    // Inputs
    const geminiKeyInput = document.getElementById('gemini-key');
    const openaiKeyInput = document.getElementById('openai-key');
    const anthropicKeyInput = document.getElementById('anthropic-key');
    const grokKeyInput = document.getElementById('grok-key');
    const deepseekKeyInput = document.getElementById('deepseek-key');
    const licenseKeyInput = document.getElementById('license-key');

    // Load Settings & Theme
    chrome.storage.local.get(['geminiKey', 'openaiKey', 'anthropicKey', 'grokKey', 'deepseekKey', 'theme', 'history', 'updating_key', 'pending_explanation', 'hasCompletedOnboarding', 'autoSummarizeEnabled'], (result) => {
        if (result.geminiKey) geminiKeyInput.value = result.geminiKey;
        if (result.openaiKey) openaiKeyInput.value = result.openaiKey;
        if (result.anthropicKey) anthropicKeyInput.value = result.anthropicKey;
        if (result.grokKey) grokKeyInput.value = result.grokKey;
        if (result.deepseekKey) deepseekKeyInput.value = result.deepseekKey;
        if (result.deepseekKey) deepseekKeyInput.value = result.deepseekKey;


        // Initialize history
        window.historyData = result.history || [];

        // Apply saved theme or default to light
        const currentTheme = result.theme || 'dark';
        applyTheme(currentTheme);

        // Initial UI Update based on license
        updateProSettingsVisibility();

        // FORCE Auto-Summarize to always be ON (remove any stored OFF state)
        chrome.storage.local.set({ autoSummarizeEnabled: true }, () => {
            updateAutoSummarizeButton(true);
        });

        // Check keys but DON'T transition yet (Wait for Timeout)
        const hasKeys = result.geminiKey || result.openaiKey || result.anthropicKey || result.grokKey || result.deepseekKey;

        // SPLASH SCREEN LOGIC: Determine Entry Point
        if (!result.hasCompletedOnboarding && !hasKeys) {
            // First time ever: Show Onboarding
            onboardingView.classList.remove('hidden');
            setupView.classList.add('hidden');
        } else {
            // Returning user or already set up
            setupView.classList.remove('hidden');
            onboardingView.classList.add('hidden');
        }

        mainView.classList.add('hidden');

        // Initialize UI Locks from storage
        if (result.updating_key) {
            window.uiLocks[result.updating_key] = true;
        }

        function attemptEntry() {
            // Unconditional Entry (User request: Don't ask for keys at start)
            setupView.classList.add('hidden');
            mainView.classList.remove('hidden');

            // Ensure results container is visible for Auth Card / Ready state
            document.getElementById('results-container').classList.remove('hidden');

            // Trigger Auth Check for the default tab immediately
            switchTab('gemini-section');

            // Auto-Summarize on Launch (User request: "query being sent when you land")
            // CRITICAL FIX: Do NOT auto-summarize if we are in the middle of updating a key!
            if (result.pending_explanation) {
                // Handle "Explain Selection" Flow
                debugToast(' Explaining Selected Text...');
                const input = document.getElementById('main-chat-input');
                const sendBtn = document.getElementById('main-send-btn');

                // Clear storage first
                chrome.storage.local.remove('pending_explanation');

                setTimeout(() => {
                    if (input) {
                        input.value = `Explain "${result.pending_explanation}" in reference to the page content.`;
                        // Auto-Press Enter (Trigger Send)
                        const activeSec = document.querySelector('.active-section') || document.getElementById('gemini-section');
                        if (activeSec) {
                            const service = activeSec.id.replace('-section', '');
                            triggerFollowUpChat(service, input.value);
                            setTimeout(() => input.value = '', 100);
                        }
                    }
                }, 800);
            } else if (!result.updating_key) {
                // Auto-summarize on opening (even without keys - will show auth cards if needed)
                setTimeout(() => {
                    // PARANOID CHECK: Re-read storage to ensure no update started
                    chrome.storage.local.get(['updating_key', 'autoSummarizeEnabled'], (latest) => {
                        const isAutoSummarizeEnabled = latest.autoSummarizeEnabled !== false;
                        if (!latest.updating_key && isAutoSummarizeEnabled) {
                            debugToast('Auto-Summarize Triggered');
                            // Directly trigger explanation instead of clicking chip
                            startExplanation();
                        } else {
                            if (latest.updating_key) {
                                debugToast(`Auto-Summarize BLOCKED by Update Lock: ${latest.updating_key}`);
                            } else {
                                debugToast('Auto-Summarize is OFF');
                            }
                        }
                    });
                }, 500);
            } else {
                // Auto-summarize logic is OFF or blocked
                if (result.updating_key) debugToast(`Auto-Summarize Skipped (Update Active: ${result.updating_key})`);
            }
        }

        // 1. Auto-redirect after 3 seconds
        setTimeout(() => {
            attemptEntry();
        }, 3000);
    });

    // Finish Setup Logic
    if (finishSetupBtn) {
        finishSetupBtn.addEventListener('click', () => {
            const gKey = setupGeminiInput.value.trim();
            const oKey = setupOpenaiInput.value.trim();

            if (!gKey && !oKey) {
                alert("Please enter at least one API Key to get started.");
                return;
            }

            const newKeys = {};
            if (gKey) newKeys.geminiKey = gKey;
            if (oKey) newKeys.openaiKey = oKey;

            // Also mark onboarding as complete
            newKeys.hasCompletedOnboarding = true;

            chrome.storage.local.set(newKeys, () => {
                // Update specific inputs in settings so they are ready
                if (gKey) geminiKeyInput.value = gKey;
                if (oKey) openaiKeyInput.value = oKey;

                // Unlock App
                setupView.classList.add('hidden');
                mainView.classList.remove('hidden');
            });
        });
    }

    // Onboarding Button
    if (startOnboardingBtn) {
        startOnboardingBtn.addEventListener('click', () => {
            // Mark as complete immediately or just transition?
            // Let's transition to Setup. We mark as complete when they actually finish setup.
            // Or we mark it now so they don't see it again if they reload?
            // Safer to mark now.
            chrome.storage.local.set({ hasCompletedOnboarding: true }, () => {
                onboardingView.classList.add('hidden');
                setupView.classList.remove('hidden');
            });
        });
    }

    // Theme Toggle Logic
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
    });

    // Auto-Summarize Toggle Logic
    if (autoSummarizeToggle) {
        autoSummarizeToggle.addEventListener('click', () => {
            chrome.storage.local.get(['autoSummarizeEnabled'], (result) => {
                const currentState = result.autoSummarizeEnabled !== false; // default true
                const newState = !currentState;
                chrome.storage.local.set({ autoSummarizeEnabled: newState }, () => {
                    updateAutoSummarizeButton(newState);
                    debugToast(`Auto-Summarize: ${newState ? 'ON' : 'OFF'}`);
                });
            });
        });
    }

    function updateAutoSummarizeButton(enabled) {
        if (autoSummarizeToggle) {
            autoSummarizeToggle.style.opacity = enabled ? '1' : '0.4';
            autoSummarizeToggle.title = enabled ? 'Auto-Summarize: ON (Click to disable)' : 'Auto-Summarize: OFF (Click to enable)';
        }
    }

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
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            openSettings(); // No arg = show all
        });
    }


    if (backBtn) {
        backBtn.addEventListener('click', () => {
            settingsView.classList.add('hidden');
            mainView.classList.remove('hidden');
            if (settingsBtn) settingsBtn.classList.remove('hidden');
            const headerActions = document.querySelector('.header-actions');
            if (headerActions) headerActions.classList.remove('hidden');
        });
    }


    // Config Buttons Logic
    document.querySelectorAll('.config-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetId = btn.getAttribute('data-target');

            // If the button is inside a section, trigger inline auth card
            const section = btn.closest('.result-section'); // Use btn, not e.target
            if (section) {
                const sectionId = section.id;
                const storageKey = modelKeyMap[sectionId];
                if (storageKey) {
                    debugToast(`Update Started: Locking ${sectionId}`);

                    // LOCK UI IMMEDIATELY
                    window.uiLocks[sectionId] = true;

                    // Set flag for persistence AND wait for it
                    chrome.storage.local.set({ 'updating_key': sectionId }, () => {
                        const modelId = Object.keys(AI_MODELS).find(k => AI_MODELS[k].keyStorageName === storageKey);
                        if (modelId) {
                            // Clear history to prevent restoring the error message
                            if (conversationHistory[modelId]) conversationHistory[modelId] = [];
                            window.open(AI_MODELS[modelId].keyUrl, '_blank');
                        }
                    });

                    renderAuthCard(section, sectionId, storageKey, true); // Force setup screen
                    return;
                }
            }

            // Fallback to settings view
            openSettings(targetId);
        });
    });

    // Handle interactive "Update Key" links in error messages
    document.addEventListener('click', (e) => {
        const link = e.target.closest('.update-key-link');
        if (link) {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            const keyName = link.getAttribute('data-key');
            const section = document.getElementById(sectionId);

            if (section && keyName) {
                debugToast(`Update Link Clicked: Locking ${sectionId}`);

                // LOCK UI IMMEDIATELY
                window.uiLocks[sectionId] = true;

                // 1. Render Auth Card (UI Update) FIRST for immediate feedback
                renderAuthCard(section, sectionId, keyName, true);

                // 2. Set flag for persistence AND wait for it
                chrome.storage.local.set({ 'updating_key': sectionId }, () => {
                    console.log(`[UpdateLink] updating_key set for ${sectionId}`);
                    const modelId = Object.keys(AI_MODELS).find(k => AI_MODELS[k].keyStorageName === keyName);
                    if (modelId) {
                        // Clearing history and opening URL
                        debugToast(`Opening ${modelId} Website...`);
                        // Clear history to prevent restoring the error message
                        if (conversationHistory[modelId]) conversationHistory[modelId] = [];

                        setTimeout(() => {
                            window.open(AI_MODELS[modelId].keyUrl, '_blank');
                        }, 50);
                    }
                });
            }
        }
    });

    function openSettings(focusId = null) {
        mainView.classList.add('hidden');
        settingsView.classList.remove('hidden');
        if (settingsBtn) settingsBtn.classList.add('hidden');

        // Manage visibility of all input groups
        const groups = settingsView.querySelectorAll('.input-group');
        groups.forEach(group => {
            // First, determine if this group should ever be visible
            let isBlacklisted = false;
            if (group.id === 'license-input-group' && !API_CONFIG.developerMode) {
                isBlacklisted = true;
            }

            if (isBlacklisted) {
                group.classList.add('hidden');
                return; // Skip further logic for this group
            }

            // Normal focus logic
            if (!focusId) {
                group.classList.remove('hidden');
            } else {
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
        if (proSettings) proSettings.classList.remove('hidden');
    }

    // Save Settings
    saveSettingsBtn.addEventListener('click', () => {
        saveSettingsBtn.textContent = 'Saving...';

        const keys = {
            geminiKey: geminiKeyInput.value.trim(),
            openaiKey: openaiKeyInput.value.trim(),
            anthropicKey: anthropicKeyInput.value.trim(),
            grokKey: grokKeyInput.value.trim(),
            deepseekKey: deepseekKeyInput.value.trim()
        };

        chrome.storage.local.set(keys, () => {
            saveSettingsBtn.textContent = 'Save';
            alert('Settings Saved!');
            backBtn.click();
        });
    });

    // Tab Logic
    // defined at top of DOMContentLoaded


    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-tab');
            switchTab(targetId);
        });
    });


    // Initial Tab Setup: Hide everything except Gemini
    document.querySelectorAll('.result-section').forEach(sec => {
        if (sec.id !== 'gemini-section') {
            sec.style.display = 'none';
            sec.classList.remove('active-section');
        } else {
            sec.style.display = 'block';
            sec.classList.add('active-section');
        }
    });

    // Map Tabs to required keys
    // Map Tabs to required keys
    // modelKeyMap is defined globally at top of file

    const modelNameMap = {
        'gemini-section': 'Gemini',
        'openai-section': 'ChatGPT',
        'anthropic-section': 'Claude',
        'grok-section': 'Grok',
        'deepseek-section': 'DeepSeek'
    };

    function switchTab(tabId, direction = null) {
        // Update Buttons
        tabBtns.forEach(btn => {
            if (btn.getAttribute('data-tab') === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update Sections
        resultSections.forEach(sec => {
            if (sec.id === tabId) {
                sec.classList.add('active-section');
                sec.style.display = 'block';

                // Apply Animation if direction is provided
                sec.classList.remove('slide-in-right', 'slide-in-left', 'fade-in'); // Reset
                if (direction === 'right') {
                    sec.classList.add('slide-in-left'); // Swiping RIGHT moves content from LEFT? 
                    // Wait, standard mobile logic:
                    // Swipe LEFT (Finger moves right-to-left) -> Go to Next Tab (Items come from Right)
                    // Swipe RIGHT (Finger moves left-to-right) -> Go to Prev Tab (Items come from Left)

                    // My previous swipe logic: deltaX > 0 (Swipe Left on Trackpad usually) -> Next Index
                    // Let's stick to visual logic:
                    // Next Tab -> Comes from Right
                    // Prev Tab -> Comes from Left
                } else if (direction === 'left') {
                    sec.classList.add('slide-in-right');
                } else {
                    sec.classList.add('fade-in'); // Default click animation
                }

                // ON-DEMAND AUTH CHECK
                const requiredKey = modelKeyMap[tabId];
                if (requiredKey) {
                    chrome.storage.local.get([requiredKey, 'updating_key'], (res) => {
                        const contentDiv = sec.querySelector('.content');
                        const header = sec.querySelector('.section-header'); // Define header here
                        const footerPrompt = document.getElementById('global-chat-footer');
                        const isUpdating = res['updating_key'] === tabId;

                        // console.log(`[SwitchTab] Checking ${tabId}: KeyExists=${!!res[requiredKey]}, IsUpdating=${isUpdating}`);

                        if (!res[requiredKey] || isUpdating) {
                            // Key MISSING or UPDATING: Show Auth Card, Hide Footer Prompt
                            if (footerPrompt) footerPrompt.classList.add('hidden');
                            if (header) header.style.display = 'none'; // Ensure header is hidden

                            const existingAuthCard = contentDiv?.querySelector('.auth-card');
                            if (!existingAuthCard) {
                                renderAuthCard(sec, tabId, requiredKey, isUpdating); // Pass updating flag to force setup if needed
                            }
                        } else {
                            // Key EXISTS and NOT Updating
                            // header is already defined above
                            const existingAuthCard = contentDiv?.querySelector('.auth-card');

                            // ONLY clear and show "Ready" if we are NOT in the middle of an auth/update flow
                            // AND not currently updating (redundant check but safe)
                            if (!existingAuthCard && !isUpdating) {
                                if (header) header.style.display = '';

                                if (contentDiv && !contentDiv.innerHTML.trim()) {
                                    contentDiv.innerHTML = `
                                        <div class="empty-state">
                                            <div style="font-size: 2rem; margin-bottom: 10px;">👋</div>
                                            <p><strong>${modelNameMap[tabId]} is Ready!</strong></p>
                                            <p style="font-size: 0.9rem; opacity: 0.8;">Ask anything or click a chip above.</p>
                                        </div>
                                    `;
                                }

                                // Show Footer if there is a chat session or its "ready"
                                if (tabId !== 'history-section' && footerPrompt) {
                                    footerPrompt.classList.remove('hidden');
                                    setupChatInterface(tabId);
                                }
                            } else {
                                // If Auth Card IS present, ensure header stays hidden
                                if (header) header.style.display = 'none';
                                if (footerPrompt) footerPrompt.classList.add('hidden');
                            }
                        }
                    });
                } else if (tabId === 'history-section') {
                    const footerPrompt = document.getElementById('global-chat-footer');
                    if (footerPrompt) footerPrompt.classList.add('hidden');
                    renderHistory();
                }

            } else {
                sec.classList.remove('active-section');
                sec.style.display = 'none';
            }
        });
    }

    function renderAuthCard(section, tabId, keyName, preShowSetup = false) {
        const contentDiv = section.querySelector('.content');
        if (!contentDiv) return;

        // Hide the header for Auth View
        const header = section.querySelector('.section-header');
        if (header) header.style.display = 'none';

        // Determine which model config to use
        const modelKey = Object.keys(AI_MODELS).find(key => AI_MODELS[key].keyStorageName === keyName);
        const modelConfig = modelKey ? AI_MODELS[modelKey] : null;

        if (!modelConfig) {
            console.error(`No configuration found for key: ${keyName}`);
            return;
        }

        const { displayName, providerName, iconClass, keyUrl, instructions } = modelConfig;

        // Generate instructions HTML from array
        const instructionsHTML = instructions.map(instruction => `<li>${instruction}</li>`).join('');

        contentDiv.innerHTML = `
            <div class="auth-card">
                <div id="auth-intro-${keyName}" class="${preShowSetup ? 'hidden' : ''}">
                    <div class="auth-header">
                        <h2>Log in or sign up</h2>
                        <p>Connect your ${displayName} account to continue.</p>
                    </div>
                    
                    <button id="get-key-btn-${keyName}" class="social-btn">
                         <i class="${iconClass}"></i> Continue with ${providerName}
                    </button>
                    
                    <div class="auth-divider" style="margin: 20px 0; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 0.8rem; gap: 10px; width: 100%;">
                        <div style="flex: 1; height: 1px; background: rgba(255,255,255,0.1);"></div>
                        <span>OR</span>
                        <div style="flex: 1; height: 1px; background: rgba(255,255,255,0.1);"></div>
                    </div>

                    <a href="#" id="show-input-direct-${keyName}" style="color: var(--primary-color); font-size: 0.85rem; text-decoration: none; opacity: 0.8;">Already have a key? Paste it here</a>
                </div>

                <div id="auth-setup-sec-${keyName}" class="${preShowSetup ? '' : 'hidden'}">
                    <div class="auth-header">
                        <h2>Setup ${displayName}</h2>
                        <p>Follow the steps below to connect your account.</p>
                    </div>

                    <div id="auth-instructions-${keyName}" class="auth-instructions">
                        <button id="setup-get-key-btn-${keyName}" class="social-btn" style="width: 100%; margin-bottom: 15px; font-size: 0.9rem;">
                             <i class="${iconClass}"></i> Get ${displayName} API Key
                        </button>
                        <h3>Get your ${displayName} API Key:</h3>
                        <ol>
                            ${instructionsHTML}
                        </ol>
                    </div>

                    <div class="auth-input-wrapper">
                        <input type="password" id="inline-${keyName}" class="auth-key-input" placeholder="Paste your API Key here...">
                    </div>

                    <button id="btn-${keyName}" class="auth-continue-btn" style="width: 100%; margin-top: 10px;">Continue</button>
                    
                    <button id="go-back-auth-${keyName}" style="background: none; border: none; color: var(--text-secondary); font-size: 0.85rem; margin-top: 15px; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                        <i class="fa-solid fa-arrow-left"></i> Back
                    </button>
                </div>
            </div>
        `;

        // Add Listeners using scoped selectors
        setTimeout(() => {
            const authCard = section.querySelector('.auth-card');
            if (!authCard) return;

            const getKeyBtn = authCard.querySelector(`#get-key-btn-${keyName}`);
            const showDirectBtn = authCard.querySelector(`#show-input-direct-${keyName}`);
            const goBackBtn = authCard.querySelector(`#go-back-auth-${keyName}`);

            const introDiv = authCard.querySelector(`#auth-intro-${keyName}`);
            const setupDiv = authCard.querySelector(`#auth-setup-sec-${keyName}`);

            const showSetup = () => {
                if (introDiv) {
                    introDiv.classList.add('hidden');
                    introDiv.style.display = 'none';
                }
                if (setupDiv) {
                    setupDiv.classList.remove('hidden');
                    setupDiv.style.display = 'block';
                    const input = setupDiv.querySelector('input');
                    if (input) input.focus();
                }
            };

            const setupGetKeyBtn = authCard.querySelector(`#setup-get-key-btn-${keyName}`);

            const showIntro = () => {
                if (introDiv) {
                    introDiv.classList.remove('hidden');
                    introDiv.style.display = 'block';
                }
                if (setupDiv) {
                    setupDiv.classList.add('hidden');
                    setupDiv.style.display = 'none';
                }
            };

            if (setupGetKeyBtn) {
                setupGetKeyBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.open(keyUrl, '_blank');
                });
            }

            if (getKeyBtn) {
                getKeyBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.open(keyUrl, '_blank');
                    showSetup();
                });
            }

            if (showDirectBtn) {
                showDirectBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    showSetup();
                });
            }

            if (goBackBtn) {
                goBackBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    // Clear updating flag
                    chrome.storage.local.remove('updating_key');
                    window.uiLocks[tabId] = false; // UNLOCK
                    showIntro();
                });
            }

            // Setup "Continue" (Confirm) Button
            const confirmBtn = authCard.querySelector(`#btn-${keyName}`);
            const keyInput = authCard.querySelector(`#inline-${keyName}`);

            if (confirmBtn && keyInput) {
                confirmBtn.addEventListener('click', () => {
                    const val = keyInput.value.trim();
                    if (!val) {
                        keyInput.style.borderColor = "#ef4444";
                        return;
                    }

                    const saveObj = {};
                    saveObj[keyName] = val;

                    confirmBtn.textContent = "Connecting...";
                    confirmBtn.style.opacity = "0.7";
                    confirmBtn.disabled = true;

                    // Safety Timeout: Force unlock if storage hangs
                    const safetyTimeout = setTimeout(() => {
                        console.warn('Storage set timed out, forcing UI update.');
                        // Manually trigger success flow (simplified) or at least unlock
                        window.uiLocks[tabId] = false;
                        confirmBtn.textContent = "Saved";
                        confirmBtn.disabled = false;
                        // Let the user try again or assume it worked
                    }, 5000);

                    chrome.storage.local.set(saveObj, () => {
                        clearTimeout(safetyTimeout);

                        // Clear updating flag on success
                        chrome.storage.local.remove('updating_key');
                        window.uiLocks[tabId] = false; // UNLOCK

                        // Restore Header
                        if (header) header.style.display = '';

                        // Show Success Content
                        contentDiv.innerHTML = `
                            <div class="empty-state">
                                <div style="font-size: 2rem; margin-bottom: 10px;">✨</div>
                                <p><strong>${displayName} is connected!</strong></p>
                                <p style="font-size: 0.9rem; opacity: 0.8;">Ready to process your requests.</p>
                            </div>
                        `;

                        // Re-initialize Global Inputs
                        const globalInput = document.getElementById(keyName);
                        if (globalInput) globalInput.value = val;

                        // Show footer if key exists now
                        const footerPrompt = document.getElementById('global-chat-footer');
                        if (footerPrompt) {
                            footerPrompt.classList.remove('hidden');
                            setupChatInterface(tabId);
                        }
                    });
                });

                keyInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') confirmBtn.click();
                });
            }
        }, 80);
    }

    // Prompt Logic
    const promptInput = document.getElementById('main-chat-input');
    const chips = document.querySelectorAll('.chip');


    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const query = chip.getAttribute('data-prompt');
            // Only trigger if it's a prompt chip
            if (promptInput && query) {
                promptInput.value = query;

                // Programmatic submission since button is gone
                // Find active section to determine context
                const activeSec = document.querySelector('.active-section');
                if (activeSec) {
                    const service = activeSec.id.replace('-section', '');
                    triggerFollowUpChat(service, query);
                    setTimeout(() => promptInput.value = '', 100);
                }
            }
        });
    });

    if (promptInput) {
        promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Prevent newline
                const query = promptInput.value.trim();
                if (!query) return;

                const activeSec = document.querySelector('.active-section');
                if (activeSec) {
                    const service = activeSec.id.replace('-section', '');
                    triggerFollowUpChat(service, query);
                    promptInput.value = '';
                }
            }
        });

        // Auto-expand textarea
        promptInput.addEventListener('input', () => {
            promptInput.style.height = 'auto';
            promptInput.style.height = (promptInput.scrollHeight) + 'px';
        });
    }


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
    // Super Prompt Bar Logic
    // useScreenshot/usePageText defined globally at top

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

        // Auto-populate prompt if empty and turning ON
        if (useScreenshot && promptInput.value.trim() === '') {
            const query = "Explain the screenshot";
            promptInput.value = query;

            // Auto-Press Enter (Trigger Send)
            const activeSec = document.querySelector('.active-section');
            if (activeSec) {
                const service = activeSec.id.replace('-section', '');
                triggerFollowUpChat(service, query);
                setTimeout(() => promptInput.value = '', 100);
            }
        }
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

    // --- Helper Functions ---

    function formatErrorMessage(msg, sectionId = null, keyName = null) {
        let displayMsg = msg;
        let isCritical = false;

        if (msg === "Quota Exceeded") {
            displayMsg = "Quota Exceeded";
            isCritical = true;
        } else if (msg === "Invalid API Key") {
            displayMsg = "Invalid API Key";
            isCritical = true;
        }

        let html = `<div class="error-message">⚠️ ${displayMsg}</div>`;

        // If it's an API Key error, show a quick link to update it
        if (isCritical || msg.toLowerCase().includes("api key") || msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("quota")) {
            if (sectionId && keyName) {
                const helperText = (msg === "Quota Exceeded" || msg.toLowerCase().includes("quota"))
                    ? "Your free tier quota is exhausted. Please wait or use a different key."
                    : "Your API key appears to be invalid.";

                html += `
                    <div style="margin-top: 10px;">
                         <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 8px;">
                            ${helperText}
                        </p>
                        <a href="#" class="update-key-link" data-section="${sectionId}" data-key="${keyName}" style="color: #ef4444; text-decoration: underline; font-size: 0.9rem;">
                           Update API Key
                        </a>
                    </div>
                `;
            }
        }
        return html;
    }

    function handleApiError(err, sectionId, keyName) {
        console.error(`API Error (${sectionId}):`, err);
        let msg = err.message || "Unknown error occurred.";

        // Fix for object error (DeepSeek sometimes returns object)
        if (typeof msg === 'object') msg = JSON.stringify(msg);

        const errorHtml = formatErrorMessage(msg, sectionId, keyName);

        // If it's a chat context, render as message to preserve history. Otherwise, update the section.
        const chatContainer = document.querySelector(`#${sectionId} .chat-container`);
        if (chatContainer) {
            renderChatMessage('assistant', errorHtml, sectionId, null, null, true);
        } else {
            updateSection(sectionId, errorHtml);
        }
    }

    async function scrapePageText() {
        return new Promise((resolve) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (!tabs || tabs.length === 0) {
                    resolve('');
                    return;
                }
                const activeTab = tabs[0];

                // IGNORE: chrome://, edge://, about:blank, etc.
                if (activeTab.url && (activeTab.url.startsWith('chrome://') || activeTab.url.startsWith('edge://') || activeTab.url.startsWith('about:') || activeTab.url.startsWith('chrome-extension://'))) {
                    resolve('');
                    return;
                }

                chrome.scripting.executeScript({
                    target: { tabId: activeTab.id },
                    func: () => {
                        // Better text extraction using Readability logic (simplified)
                        // Or just document.body.innerText for now
                        return document.body.innerText;
                    }
                }, (results) => {
                    if (chrome.runtime.lastError || !results || !results[0]) {
                        console.warn("Scripting error or restricted page:", chrome.runtime.lastError);
                        resolve('');
                    } else {
                        resolve(results[0].result || '');
                    }
                });
            });
        });
    }

    // Load Text logic
    loadTextBtn.addEventListener('click', async () => {
        loadTextBtn.style.opacity = '0.5';
        const text = await scrapePageText();
        if (text) {
            // promptInput.value += "\n\n" + text; // Append or Replace? User asked to "load it on the prompt box"
            // Usually replacing or filling is better context. Let's append if exists.
            const query = "Explain this page:\n\n" + text;
            promptInput.value = query;

            // Auto-Press Enter (Trigger Send)
            const activeSec = document.querySelector('.active-section');
            if (activeSec) {
                const service = activeSec.id.replace('-section', '');
                triggerFollowUpChat(service, query);
                setTimeout(() => promptInput.value = '', 100);
            }

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

    // Send Button logic removed (migrated to Enter key)


    // Auto-Refresh Logic
    let debounceTimer;
    const triggerRefresh = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            // Check Preference before Auto-Explaining on Tab Switch/Navigation
            chrome.storage.local.get(['autoSummarizeEnabled'], (result) => {
                const isAutoSummarizeEnabled = result.autoSummarizeEnabled !== false; // default true
                if (isAutoSummarizeEnabled) {
                    startExplanation();
                    debugToast("Auto-Summarize Triggered (Nav)");
                } else {
                    // Auto-Summarize skipped (clean slate)
                    // Optional: Clear previous results or show "Ready" state?
                    // For now, doing nothing is safer to avoid clearing user's manual work.
                }
            });
        }, 800);
    };

    // Listeners for Tab Switching and Navigation
    chrome.tabs.onActivated.addListener(triggerRefresh);
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete' && tab.active) {
            triggerRefresh(); // Auto-refresh if page re-loads (Optional feature, logic reuse)
        }
    });

    // --- Swipe Navigation (Two-finger swipe to switch tabs) ---
    const resultsContainer = document.getElementById('results-container');
    let isSwiping = false;

    if (resultsContainer) {
        resultsContainer.addEventListener('wheel', (e) => {
            // Check if vertical scroll is dominant (normal scrolling)
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) return;

            // Only trigger if horizontal swipe is significant
            if (Math.abs(e.deltaX) > 30) {
                if (isSwiping) return; // Debounce

                e.preventDefault(); // Prevent browser back/forward navigation if possible

                // Find current active tab index
                const tabsArray = Array.from(tabBtns);
                const activeIndex = tabsArray.findIndex(btn => btn.classList.contains('active'));

                if (activeIndex === -1) return;

                let nextIndex = activeIndex;

                if (e.deltaX > 0) {
                    // Swipe Right -> Next Tab
                    nextIndex = activeIndex + 1;
                } else {
                    // Swipe Left -> Previous Tab
                    nextIndex = activeIndex - 1;
                }

                // Bounds Check
                if (nextIndex >= 0 && nextIndex < tabsArray.length) {
                    isSwiping = true;

                    const nextTabId = tabsArray[nextIndex].getAttribute('data-tab');

                    // Determine visual direction
                    // If going to Next Index (index increases), content should Slide In from Right
                    // If going to Prev Index (index decreases), content should Slide In from Left
                    // Note: 'left' means "Slide from Right to Left" effectively? 
                    // Let's map to my CSS classes:
                    // slide-in-right: transform(20px) -> 0. Comes FROM right. (For Next Tab)
                    // slide-in-left: transform(-20px) -> 0. Comes FROM left. (For Prev Tab)

                    const animDir = nextIndex > activeIndex ? 'left' : 'right';
                    // Wait, if I use 'left' param -> it adds 'slide-in-right' class in switchTab logic above?
                    // Let's match the params passed to switchTab:

                    const directionParam = nextIndex > activeIndex ? 'left' : 'right';

                    switchTab(nextTabId, directionParam);

                    // Reset debounce after delay
                    setTimeout(() => {
                        isSwiping = false;
                    }, 400); // 400ms debounce
                }
            }
        }, { passive: false });
    }

    // Ensure we run on initial load


    function updateSection(id, text) {
        // GATEKEEPER: If UI is locked for this section, DROP the update
        if (window.uiLocks && window.uiLocks[id]) {
            console.warn(`[Gatekeeper] updateSection BLOCKED for ${id} because it is Locked (Updating Key).`);
            debugToast(`Blocked Content Update for ${id}`);
            return;
        }

        // Simple MD replacement for newlines, bold, italics could be added here or use a library
        // For now, textContent is safe, innerHTML with some parsing is better
        const contentDiv = document.querySelector(`#${id} .content`);
        contentDiv.innerHTML = text;

        // Auto-scroll to bottom after DOM updates
        requestAnimationFrame(() => {
            contentDiv.scrollTo({ top: contentDiv.scrollHeight, behavior: 'smooth' });
        });
    }

    // --- Chat Interface Functions for Guided Learning ---

    function renderChatMessage(role, content, sectionId, imageUrl = null, messageId = null, isHtml = false) {
        // GATEKEEPER: If UI is locked, DROP the message
        if (window.uiLocks && window.uiLocks[sectionId]) {
            console.warn(`[Gatekeeper] renderChatMessage BLOCKED for ${sectionId} because it is Locked (Updating Key).`);
            return;
        }

        const contentDiv = document.querySelector(`#${sectionId} .content`);

        // Get or create chat container
        let chatContainer = contentDiv.querySelector('.chat-container');
        if (!chatContainer) {
            chatContainer = document.createElement('div');
            chatContainer.className = 'chat-container';
            contentDiv.innerHTML = ''; // Clear existing content
            contentDiv.appendChild(chatContainer);
        }

        let messageDiv;
        if (messageId) {
            messageDiv = document.getElementById(messageId);
        }

        if (!messageDiv) {
            messageDiv = document.createElement('div');
            if (messageId) messageDiv.id = messageId;
            messageDiv.className = `chat-message ${role}-message`;
            chatContainer.appendChild(messageDiv);
        }

        let imageHtml = imageUrl ? `<img src="${imageUrl}" class="chat-screenshot" style="max-width: 100%; border-radius: 8px; margin-bottom: 8px; cursor: zoom-in; display: block;" onclick="window.open('${imageUrl}')">` : '';

        // If it's the assistant, we might be formatting markdown. 
        // If it's a typing indicator or intermediate state, we might not.
        const formattedContent = (isHtml || content === '...' || content === '') ? content : classFormatMarkdown(content);

        messageDiv.innerHTML = `
            <div class="message-bubble">
                ${imageHtml}
                ${formattedContent}
            </div>
        `;

        // Auto-scroll to latest message (more reliable method)
        requestAnimationFrame(() => {
            messageDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
        });
    }

    function setupChatInterface() {
        const footer = document.getElementById('global-chat-footer');
        if (!footer) return;

        const input = footer.querySelector('.chat-input');
        if (!input) return;

        // Legacy send/clear buttons removed in v1.3
        // Also removed redundant input cloning which was breaking the global listener.

        const clearBtn = footer.querySelector('.chat-clear-btn');
        if (clearBtn) {
            // Use existing button or clone if needed (cloning removes old listeners which is safer here)
            const newClearBtn = clearBtn.cloneNode(true);
            clearBtn.parentNode.replaceChild(newClearBtn, clearBtn);

            newClearBtn.addEventListener('click', () => {
                const activeSec = document.querySelector('.active-section');
                if (!activeSec) return;
                const service = activeSec.id.replace('-section', '');

                if (conversationHistory[service]) {
                    conversationHistory[service] = [];
                }

                const contentDiv = activeSec.querySelector('.content');
                if (contentDiv) {
                    contentDiv.innerHTML = `
                        <div class="empty-state">
                            <div style="font-size: 2rem; margin-bottom: 10px;">💬</div>
                            <p><strong>Conversation cleared!</strong></p>
                            <p style="font-size: 0.9rem; opacity: 0.8;">Ready for a new question.</p>
                        </div>
                    `;
                }
            });
        }
    }

    async function triggerFollowUpChat(service, message) {
        // Update session activity (lightweight, async)
        updateLastActivity();

        // Find existing chat container or create one
        const sectionId = `${service}-section`;
        const section = document.getElementById(sectionId);

        // Capture Screenshot IF toggle is active (Do this BEFORE rendering so we can include it in the bubble if desired)
        let screenshotData = null;
        if (typeof useScreenshot !== 'undefined' && useScreenshot) {
            try {
                screenshotData = await captureTab();
            } catch (err) {
                console.error("Screenshot capture failed for follow-up:", err);
            }
        }

        // Search for relevant context if it's the first follow-up and we don't have page text yet
        // (Actually, startExplanation already keeps history, so follow-ups should use it.)

        // Render user message immediately (with screenshot support)
        renderChatMessage('user', message, sectionId, screenshotData);

        const typingId = `${service}-typing-${Date.now()}`;
        renderChatMessage('assistant', 'Loading...', sectionId, null, typingId);

        try {
            // Get Keys again (in case they changed)
            const storageKeys = await chrome.storage.local.get(['geminiKey', 'openaiKey', 'anthropicKey', 'grokKey', 'deepseekKey']);
            const keys = {
                geminiKey: storageKeys.geminiKey || API_CONFIG.geminiKey,
                openaiKey: storageKeys.openaiKey || API_CONFIG.openaiKey,
                anthropicKey: storageKeys.anthropicKey || API_CONFIG.anthropicKey,
                grokKey: storageKeys.grokKey || API_CONFIG.grokKey,
                deepseekKey: storageKeys.deepseekKey || API_CONFIG.deepseekKey
            };

            const keyName = modelKeyMap[sectionId];
            const apiKey = keys[keyName];

            // Add to conversation history
            conversationHistory[service].push({ role: 'user', content: message });

            let response = "";

            if (service === 'gemini') {
                response = await (apiKey ? callGemini(apiKey, screenshotData, message, conversationHistory.gemini) : callAIProxy('gemini', message, screenshotData));
            } else if (service === 'openai') {
                response = await callOpenAI(apiKey, screenshotData, message, conversationHistory.openai);
            } else if (service === 'anthropic') {
                response = await callAnthropic(apiKey, screenshotData, message, conversationHistory.anthropic);
            } else if (service === 'grok') {
                response = await callGrok(apiKey, screenshotData, message, conversationHistory.grok);
            } else if (service === 'deepseek') {
                // Simplified non-streaming for now in follow-up, match the pattern
                let finalContent = "";
                await callDeepSeek(apiKey, screenshotData, message, (partial) => {
                    if (partial.content) finalContent += partial.content;
                });
                response = finalContent || "No response generated.";
            }

            // Remove typing indicator 
            const typingIndicator = document.getElementById(typingId);
            if (typingIndicator) typingIndicator.remove();

            renderChatMessage('assistant', response, sectionId);
            conversationHistory[service].push({ role: 'assistant', content: response });
            saveToHistory(message, response, service.toUpperCase());

        } catch (err) {
            const typingIndicator = document.getElementById(typingId);
            if (typingIndicator) typingIndicator.remove();
            handleApiError(err, sectionId, modelKeyMap[sectionId]);
        }
    }

    function removeTypingIndicator(sectionId) {
        const chatContainer = document.querySelector(`#${sectionId} .chat-container`);
        if (chatContainer) {
            const lastMessage = chatContainer.lastElementChild;
            if (lastMessage && lastMessage.textContent.includes('...')) {
                lastMessage.remove();
            }
        }
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

    function saveToHistory(prompt, response, service) {
        if (!prompt || !response) return;

        const newItem = {
            id: Date.now(),
            date: new Date().toISOString(),
            prompt: prompt,
            response: response,
            service: service
        };

        window.historyData = [newItem, ...(window.historyData || [])];
        if (window.historyData.length > 50) {
            window.historyData = window.historyData.slice(0, 50);
        }
        chrome.storage.local.set({ history: window.historyData });
    }

    function renderHistory() {
        const container = document.querySelector('.history-list-container');
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
            let cleanPrompt = item.prompt.replace(/Instruction: /, "").replace(/Instruction: /, "");
            if (cleanPrompt.startsWith("Context from")) cleanPrompt = "Page Context Analysis";
            if (cleanPrompt.length > 60) cleanPrompt = cleanPrompt.substring(0, 60) + "...";

            const el = document.createElement('div');
            el.className = 'history-item';
            el.innerHTML = `
                <div class="history-date">${dateStr} • ${item.service}</div>
                <div class="history-prompt">${cleanPrompt}</div>
                <div class="history-preview">${item.response.substring(0, 100)}...</div>
            `;

            el.addEventListener('click', () => {
                let sectionId = item.service.toLowerCase() + '-section';
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

    document.getElementById('clear-history-btn').addEventListener('click', () => {
        if (confirm('Clear all history?')) {
            window.historyData = [];
            chrome.storage.local.set({ history: [] });
            renderHistory();
        }
    });

    document.addEventListener('click', async (e) => {
        if (e.target && e.target.classList.contains('paste-btn')) {
            try {
                const text = await navigator.clipboard.readText();
                if (text) {
                    const targetId = e.target.getAttribute('data-target');
                    const input = document.getElementById(targetId);
                    if (input) {
                        input.value = text;
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

    async function callAIProxy(service, prompt, imageUrl) {
        if (!API_CONFIG.licenseServerUrl || API_CONFIG.licenseServerUrl === "REPLACE_WITH_YOUR_DEPLOYED_WEB_APP_URL") {
            throw new Error('Backend Proxy not configured. Help the developer by setting LicenseServerUrl.');
        }

        try {
            const resp = await fetch(API_CONFIG.licenseServerUrl, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    action: "proxy_ai",
                    service: service,
                    prompt: prompt,
                    imageUrl: imageUrl
                })
            });

            const data = await resp.json();
            if (!data.success) {
                throw new Error(data.error || "Proxy failed.");
            }
            return data.text;
        } catch (e) {
            console.error(`Proxy error (${service}):`, e);
            throw new Error(`Proxy error: ${e.message}`);
        }
    }
});
