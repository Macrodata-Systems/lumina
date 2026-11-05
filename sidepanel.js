/**
 * Lumina - AI Copilot for the Web
 * Copyright (c) 2026 Harsh Raj Singh. All Rights Reserved.
 * Proprietary and Confidential.
 */

import { initTabs, switchTab } from './modules/tabs.js';
import { attemptEntry, initAuth } from './modules/auth.js';
import { checkSessionExpiry } from './modules/session.js';
import { initSettings } from './modules/settings.js';
import { initHistory } from './modules/history.js';
import { setupChatInterface, applyTheme, updateSection, showDebugMessage, renderAuthCard } from './modules/ui.js';
import { captureTab } from './modules/utils.js';
import { getStorage, setStorage } from './modules/storage.js';
import { EventBus } from './modules/events.js';
import { triggerFollowUpChat, conversationHistory } from './modules/conversation.js';
import { scrapePageText, scrapePageMarkdown } from './modules/utils.js';
import { memorizePage } from './modules/rag.js';
import { initMemoryUI } from './modules/memory_ui.js';
import { getArchitectureHTML } from './modules/architecture_content.js';


// Global styles for Prism are loaded via HTML, but we can ensure they are applied if needed.
// (Prism is global under window.Prism)

let shortcutScreenshotAccumulator = [];
let shortcutDebounceTimeout = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize Modules
    initTabs();
    initSettings();
    initAuth();
    await initHistory();
    setupChatInterface();
    initMemoryUI();

    // 2. Load Theme
    const { theme, uiLocks } = await getStorage(['theme', 'uiLocks']);
    applyTheme(theme || 'dark');
    window.uiLocks = uiLocks || {}; // Restore locks if any

    // 3. Check Session
    checkSessionExpiry();

    // 4. Attempt Entry (Auth/Onboarding Flow)
    attemptEntry();

    // 5. Setup Global Listeners
    setupSwipeNavigation();
    setupScreenshotToggle();
    setupMemoryToggle();
    setupAudioInput();
    setupTextLoader();
    setupMemoryFeature();
    setupTabChangeListener();

    // Setup Theme Toggle
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', async () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
            await setStorage({ theme: newTheme });
        });
    }



    // Setup Auto-Summarize Toggle
    const autoSumBtn = document.getElementById('auto-summarize-toggle');
    if (autoSumBtn) {
        // Init state
        getStorage(['autoSummarizeEnabled']).then(({ autoSummarizeEnabled }) => {
            if (autoSummarizeEnabled !== false) {
                autoSumBtn.classList.add('active');
            }
        });

        autoSumBtn.addEventListener('click', async () => {
            const { autoSummarizeEnabled } = await getStorage(['autoSummarizeEnabled']);
            const newState = autoSummarizeEnabled === false; // Toggle

            await setStorage({ autoSummarizeEnabled: newState });
            autoSumBtn.classList.toggle('active', newState);

            showDebugMessage(`Auto-Summarize set to: ${newState}`);
        });
    }

    // 6. Listen for Events
    EventBus.on('history:click', ({ sectionId, response }) => {
        // showDebugMessage('Event: history:click received');
        console.log(`[DEBUG] history:click triggered for ${sectionId}`);
        switchTab(sectionId);
        updateSection(sectionId, response);
    });

    EventBus.on('trigger:refresh', (service) => {
        // showDebugMessage(`Event: trigger:refresh received for ${service}`);

        // Find last user message
        const history = conversationHistory[service];
        if (history && history.length > 0) {
            // Traverse backwards to find last user message
            let lastPrompt = null;
            for (let i = history.length - 1; i >= 0; i--) {
                if (history[i].role === 'user') {
                    // Extract text content if it's complex (e.g. multimodal)
                    // Assuming simple string or object with content
                    let content = history[i].content;
                    if (Array.isArray(content)) {
                        // Handle array content (multimodal) - just grab text parts?
                        // For simplicity, just finding first text part
                        const textPart = content.find(p => p.type === 'text');
                        if (textPart) content = textPart.text;
                    }
                    else if (typeof content === 'object' && content.text) {
                        content = content.text;
                    }

                    lastPrompt = content;
                    break;
                }
            }

            if (lastPrompt) {
                // showDebugMessage('Re-sending last prompt...');
                triggerFollowUpChat(service, lastPrompt);
            } else {
                showDebugMessage('No previous user prompt found to refresh.');
            }
        } else {
            showDebugMessage('No conversation history to refresh.');
        }
    });

    EventBus.on('trigger:explanation', () => {
        // showDebugMessage('Event: trigger:explanation received');
        const loadTextBtn = document.getElementById('load-text-btn');
        if (loadTextBtn) {
            // showDebugMessage('Clicking load-text-btn');
            loadTextBtn.click();
        } else {
            showDebugMessage('Error: load-text-btn not found');
        }
    });

    EventBus.on('key:connected', async () => {
        // showDebugMessage('Event: key:connected received');
        const { autoSummarizeEnabled } = await getStorage(['autoSummarizeEnabled']);
        if (autoSummarizeEnabled !== false) {
            // showDebugMessage('Auto-summarize enabled, waiting 500ms...');
            setTimeout(() => {
                EventBus.emit('trigger:explanation');
            }, 500);
        } else {
            // showDebugMessage('Auto-summarize DISABLED');
        }
    });

    // Handle inline key updates
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.update-key-btn');
        if (btn) {
            const sectionId = btn.getAttribute('data-section');
            const keyName = btn.getAttribute('data-key');
            const section = document.getElementById(sectionId);
            if (section && keyName) { // Fixed: keyName is the attribute value
                renderAuthCard(section, sectionId, keyName, true);
            }
        }
    });

    // Handle Chat Input Enter Key
    const chatInput = document.getElementById('main-chat-input');
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const query = chatInput.value.trim();
                const activeSec = document.querySelector('.active-section');

                if (query && activeSec) {
                    const service = activeSec.id.replace('-section', '');
                    // showDebugMessage(`Sending request to: ${service}`);
                    triggerFollowUpChat(service, query);
                    setTimeout(() => chatInput.value = '', 100);
                } else if (!activeSec) {
                    showDebugMessage('Error: No active section selected');
                }
            }
        });
    }

    // 7. Initial Auto-Summarize Trigger (on Open)
    const checkStorageTriggers = () => {
        getStorage(['autoSummarizeEnabled', 'pending_java_screenshot', 'pending_system_design_screenshot', 'pending_code_review_screenshot', 'show_architecture_trigger']).then(({ autoSummarizeEnabled, pending_java_screenshot, pending_system_design_screenshot, pending_code_review_screenshot, show_architecture_trigger }) => {

            // Handle Architecture Display Override
            if (show_architecture_trigger) {
                chrome.storage.local.remove('show_architecture_trigger');

                setTimeout(() => {
                    const activeSec = document.querySelector('.active-section');
                    if (activeSec) {
                        const sectionId = activeSec.id;
                        const archMessage = getArchitectureHTML();

                        renderChatMessage('user', "Show me the full Architecture Document of Lumina.", sectionId);

                        // Render the assistant message directly as markdown
                        setTimeout(() => {
                            renderChatMessage('assistant', archMessage, sectionId, null, null, false);
                        }, 400);
                    }
                }, 500);
                return;
            }

            // Handle Auto Java/System Design/Code Review Solver Override Strategy
            if (pending_java_screenshot || pending_system_design_screenshot || pending_code_review_screenshot) {
                const isJava = !!pending_java_screenshot;
                const isSysDesign = !!pending_system_design_screenshot;

                const incomingScreenshot = pending_java_screenshot || pending_system_design_screenshot || pending_code_review_screenshot;
                shortcutScreenshotAccumulator.push(incomingScreenshot);

                // Clear it immediately to avoid cyclic triggers
                if (isJava) chrome.storage.local.remove('pending_java_screenshot');
                else if (isSysDesign) chrome.storage.local.remove('pending_system_design_screenshot');
                else chrome.storage.local.remove('pending_code_review_screenshot');

                // Set global screenshot explicitly as a JSON array string
                window.sessionStorage.setItem('temp_screenshot_url', JSON.stringify(shortcutScreenshotAccumulator));
                window.useScreenshot = true;

                // Pre-fill input with the instruction
                const promptInput = document.getElementById('main-chat-input');
                const targetPrompt = isJava
                    ? "Explain and solve this Java code. First, briefly explain a brute-force approach including its time and space complexity. Then, provide the most optimal code solution with a brief explanation, along with its time and space complexity."
                    : isSysDesign
                        ? "Help me with this system design problem. First, suggest 2-3 clarifying questions I should ask the interviewer to better understand the constraints. Then, provide a structured, high-level architectural overview, identify key components, and suggest the best technologies or patterns to use. IMPORTANT: Phrase your entire answer precisely as if I am speaking it directly to the interviewer right now using the STAR (Situation, Task, Action, Result) method. Keep it conversational but highly technical. Also, NEVER use short forms or abbreviations without providing the full form in brackets."
                        : "Perform a thorough code review of the code in the screenshot. Identify bugs, security vulnerabilities, performance issues, and suggest improvements with code snippets. IMPORTANT: Phrase your entire answer precisely as if I am speaking it directly to the interviewer right now using the STAR (Situation, Task, Action, Result) method. Keep it conversational but highly technical. Also, NEVER use short forms or abbreviations without providing the full form in brackets.";

                if (promptInput) {
                    promptInput.value = targetPrompt;
                }

                if (shortcutDebounceTimeout) clearTimeout(shortcutDebounceTimeout);

                // Simulate the send sequence slightly delayed to act as a debounce
                shortcutDebounceTimeout = setTimeout(() => {
                    const activeSec = document.querySelector('.active-section');
                    if (activeSec) {
                        const service = activeSec.id.replace('-section', '');

                        // The triggerFollowUpChat checks window.useScreenshot and uses sessionStorage fallback
                        triggerFollowUpChat(service, targetPrompt, true);

                        if (promptInput) promptInput.value = '';
                        setTimeout(() => {
                            window.useScreenshot = false;
                            shortcutScreenshotAccumulator = []; // reset accumulator after sending
                        }, 2000);
                    }
                }, 2000);

                return; // Skip auto-summarize if we are explicitly running the Java solver
            }

            if (autoSummarizeEnabled !== false) {
                // showDebugMessage('Startup: Auto-Summarize Enabled. Triggering...');
                setTimeout(() => {
                    EventBus.emit('trigger:explanation');
                }, 1000); // Slight delay for UI to settle
            }
        });
    };

    checkStorageTriggers();

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'check_triggers') {
            checkStorageTriggers();
        }
    });

});

/**
 * Setup Swipe Navigation (Left-Right)
 */
function setupSwipeNavigation() {
    const resultsContainer = document.getElementById('results-container');
    let isSwiping = false;

    if (resultsContainer) {
        resultsContainer.addEventListener('wheel', (e) => {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) return;
            if (Math.abs(e.deltaX) > 30) {
                if (isSwiping) return;
                e.preventDefault();

                const tabBtns = document.querySelectorAll('.tab-btn');
                const tabsArray = Array.from(tabBtns);
                const activeIndex = tabsArray.findIndex(btn => btn.classList.contains('active'));

                if (activeIndex === -1) return;

                let nextIndex = activeIndex;
                if (e.deltaX > 0) nextIndex = activeIndex + 1;
                else nextIndex = activeIndex - 1;

                if (nextIndex >= 0 && nextIndex < tabsArray.length) {
                    isSwiping = true;
                    const nextTabId = tabsArray[nextIndex].getAttribute('data-tab');
                    switchTab(nextTabId);
                    setTimeout(() => isSwiping = false, 400);
                }
            }
        }, { passive: false });
    }
}

/**
 * Setup Screenshot Action (One-Shot)
 */
function setupScreenshotToggle() {
    const screenshotToggle = document.getElementById('toggle-screenshot');
    const screenshotIndicator = document.getElementById('screenshot-indicator');

    // Initialize global state to false (safe default)
    window.useScreenshot = false;

    if (screenshotToggle) {
        // Remove old listeners by cloning (simple way to ensure fresh listener)
        const newBtn = screenshotToggle.cloneNode(true);
        screenshotToggle.parentNode.replaceChild(newBtn, screenshotToggle);

        newBtn.addEventListener('click', () => {
            // showDebugMessage('Screenshot Button Clicked');

            // 1. Enable screenshot mode for this request
            window.useScreenshot = true;

            // 2. Visual Feedback (Active State)
            newBtn.classList.add('active');
            if (screenshotIndicator) screenshotIndicator.classList.remove('hidden');

            // 3. Flash Effect
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]?.id) {
                    chrome.scripting.executeScript({
                        target: { tabId: tabs[0].id },
                        func: () => {
                            const flash = document.createElement('div');
                            flash.style.cssText = `position:fixed;top:0;left:0;width:100vw;height:100vh;background:white;opacity:0.5;z-index:99999;pointer-events:none;transition:opacity 0.3s ease;`;
                            document.body.appendChild(flash);
                            setTimeout(() => { flash.style.opacity = '0'; setTimeout(() => flash.remove(), 300); }, 100);
                        }
                    }).catch((e) => showDebugMessage(`Flash failed: ${e.message}`));
                }
            });

            // 4. Trigger Chat Request
            const activeSec = document.querySelector('.active-section');
            if (activeSec) {
                const service = activeSec.id.replace('-section', '');
                const promptInput = document.getElementById('main-chat-input');

                const query = promptInput.value.trim() || "Explain what is visible on this screen.";
                // showDebugMessage(`Sending screenshot request to ${service}...`);

                // Force screenshot capture
                triggerFollowUpChat(service, query, true);

                setTimeout(() => promptInput.value = '', 100);
            } else {
                showDebugMessage('Error: No active section.');
            }

            // 5. Reset State
            setTimeout(() => {
                window.useScreenshot = false;
                newBtn.classList.remove('active');
                if (screenshotIndicator) screenshotIndicator.classList.add('hidden');
            }, 2000);
        });
    }
}

/**
 * Setup Memory Toggle (RAG)
 */
function setupMemoryToggle() {
    const memToggle = document.getElementById('toggle-memory-btn');
    window.useMemory = false; // Default

    if (memToggle) {
        memToggle.addEventListener('click', () => {
            window.useMemory = !window.useMemory;
            memToggle.classList.toggle('active', window.useMemory);
        });
    }
}

/**
 * Setup Audio Input (Web Speech API)
 */
function setupAudioInput() {
    const micBtn = document.getElementById('mic-btn');
    const promptInput = document.getElementById('main-chat-input');

    if ('webkitSpeechRecognition' in window && micBtn && promptInput) {
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;

        let isExplicitlyStopped = false;

        micBtn.addEventListener('click', () => {
            if (micBtn.classList.contains('listening')) {
                isExplicitlyStopped = true;
                recognition.stop();
                micBtn.classList.remove('listening');
            } else {
                isExplicitlyStopped = false;
                try {
                    recognition.start();
                } catch (e) { }
                micBtn.classList.add('listening');
            }
        });

        recognition.onresult = (event) => {
            // Append all new results from this continuous session
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    const transcript = event.results[i][0].transcript.trim();
                    if (transcript) {
                        promptInput.value += (promptInput.value ? " " : "") + transcript;
                    }
                }
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech Error:", event.error);
            // If the user denied permission or service is unavailable, do not try to restart
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                isExplicitlyStopped = true;
                micBtn.classList.remove('listening');
            }
        };

        recognition.onend = () => {
            // If the user didn't explicitly click stop, keep listening
            if (!isExplicitlyStopped) {
                // Add a small delay before restarting to prevent infinite crash loops
                setTimeout(() => {
                    if (!isExplicitlyStopped) {
                        try {
                            recognition.start();
                            micBtn.classList.add('listening'); // Ensure UI reflects listening state
                        } catch (e) {
                            console.error("Failed to automatically restart recognition", e);
                            micBtn.classList.remove('listening');
                        }
                    }
                }, 300);
            } else {
                micBtn.classList.remove('listening');
            }
        };
    } else if (micBtn) {
        micBtn.style.display = 'none';
    }
}

/**
 * Setup Page Text Loader
 */
function setupTextLoader() {
    const loadTextBtn = document.getElementById('load-text-btn');
    const promptInput = document.getElementById('main-chat-input');
    const togglePageTextBtn = document.getElementById('toggle-page-text-btn'); // For "Page Context: ON/OFF" logic if exists

    // Helper for scraping is in utils.js: scrapePageText
    if (loadTextBtn && promptInput) {
        loadTextBtn.addEventListener('click', async () => {
            // showDebugMessage('load-text-btn clicked');

            loadTextBtn.style.opacity = '0.5';
            // showDebugMessage('Scraping page text...');
            const text = await scrapePageText();
            // showDebugMessage(`Scraped text length: ${text ? text.length : 0}`);

            if (text) {
                const query = "Explain this page:\n\n" + text;
                promptInput.value = query; // Just prepopulate

                // Auto-send logic?
                // Original logic did auto-send.
                // We need to trigger follow up. 
                const activeSec = document.querySelector('.active-section');
                if (activeSec) {
                    const service = activeSec.id.replace('-section', '');
                    // showDebugMessage(`Triggering chat for: ${service}`);
                    triggerFollowUpChat(service, query);
                    setTimeout(() => promptInput.value = '', 100);
                } else {
                    showDebugMessage('Error: No active section found');
                }

                loadTextBtn.style.color = 'var(--primary-color)';

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
    }

    if (togglePageTextBtn) {
        togglePageTextBtn.addEventListener('click', () => {
            window.usePageText = !window.usePageText;
            togglePageTextBtn.classList.toggle('active', window.usePageText);
            togglePageTextBtn.innerHTML = window.usePageText ? '<i class="fa-solid fa-file-lines"></i>' : '<i class="fa-regular fa-file-lines"></i>';
        });
        window.usePageText = false; // Init default
    }
}

/**
 * Setup Memory Feature (RAG)
 */
function setupMemoryFeature() {
    const memBtn = document.getElementById('memorize-btn');
    if (!memBtn) return;

    memBtn.addEventListener('click', async () => {
        // 1. Get Key
        const { geminiKey: apiKey } = await getStorage(['geminiKey']);
        if (!apiKey) {
            alert('Please add a Gemini API Key in settings to use Memory.');
            return;
        }

        // 2. Visual Feedback
        const originalIcon = memBtn.innerHTML;
        memBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
        memBtn.classList.add('active');

        try {
            // 3. Get Page Details
            // Use chrome.tabs to get title/url
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) throw new Error("No active tab");

            const content = await scrapePageMarkdown();
            if (!content || content.length < 50) {
                throw new Error("Page content illegal or too short.");
            }

            // 4. Memorize
            await memorizePage({
                title: tab.title,
                url: tab.url,
                content: content
            }, apiKey);

            // 5. Success
            memBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
            setTimeout(() => {
                memBtn.innerHTML = originalIcon;
                memBtn.classList.remove('active');
            }, 2000);

        } catch (error) {
            console.error(error);
            alert(`Memorization Failed: ${error.message}`);
            memBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
            setTimeout(() => {
                memBtn.innerHTML = originalIcon;
                memBtn.classList.remove('active');
            }, 2000);
        }
    });
}

/**
 * Setup Tab Change Listeners (Auto-Summarize)
 */
function setupTabChangeListener() {
    let debounceTimer = null;

    const triggerUpdate = async () => {
        const { autoSummarizeEnabled } = await getStorage(['autoSummarizeEnabled']);
        if (autoSummarizeEnabled !== false) {
            // showDebugMessage('Tab Changed: Triggering Auto-Summarize...');
            EventBus.emit('trigger:explanation');
        }
    };

    const handleTabChange = () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            triggerUpdate();
        }, 2000); // 2 second debounce to prevent rapid firing
    };

    chrome.tabs.onActivated.addListener(handleTabChange);
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete' && tab.active) {
            handleTabChange();
        }
    });
}
