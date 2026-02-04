/**
 * Lumina - AI Copilot for the Web
 * Copyright (c) 2026 Harsh Raj Singh. All Rights Reserved.
 * Proprietary and Confidential.
 */

import { getStorage, setStorage } from './storage.js';
import { switchTab } from './tabs.js';
import { hasAnyKey } from './keys.js';
import { triggerFollowUpChat } from './conversation.js';
import { showDebugMessage } from './ui.js';
import { EventBus } from './events.js';

export function initAuth() {
    const startOnboardingBtn = document.getElementById('start-onboarding-btn');
    const finishSetupBtn = document.getElementById('finish-setup-btn');
    const setupGeminiInput = document.getElementById('setup-gemini-key');
    const setupOpenaiInput = document.getElementById('setup-openai-key');

    // Onboarding Button Removed (Auto-redirects now)


    // Finish Setup Button
    if (finishSetupBtn) {
        finishSetupBtn.addEventListener('click', () => {
            const gKey = setupGeminiInput ? setupGeminiInput.value.trim() : '';
            const oKey = setupOpenaiInput ? setupOpenaiInput.value.trim() : '';

            if (!gKey && !oKey) {
                alert("Please enter at least one API Key to get started.");
                return;
            }

            const newKeys = {};
            if (gKey) newKeys.geminiKey = gKey;
            if (oKey) newKeys.openaiKey = oKey;
            newKeys.hasCompletedOnboarding = true;

            setStorage(newKeys).then(() => {
                // Update global inputs if they exist (sync)
                const geminiKeyInput = document.getElementById('gemini-key');
                const openaiKeyInput = document.getElementById('openai-key');
                if (geminiKeyInput && gKey) geminiKeyInput.value = gKey;
                if (openaiKeyInput && oKey) openaiKeyInput.value = oKey;

                // Unlock App
                document.getElementById('setup-view').classList.add('hidden');
                document.getElementById('main-view').classList.remove('hidden');
                document.getElementById('results-container').classList.remove('hidden');

                // Trigger Gemini
                switchTab('gemini-section');
            });
        });
    }
}

export function attemptEntry() {
    getStorage(['hasCompletedOnboarding', 'pending_explanation', 'updating_key', 'autoSummarizeEnabled']).then(async (result) => {
        const hasKeys = await hasAnyKey();

        const setupView = document.getElementById('setup-view');
        const onboardingView = document.getElementById('onboarding-view');
        const mainView = document.getElementById('main-view');

        // Logic: If new user (no keys, not completed onboarding), show Onboarding
        if (!result.hasCompletedOnboarding && !hasKeys) {
            onboardingView.classList.remove('hidden');
            setupView.classList.add('hidden');
            mainView.classList.add('hidden');

            // Auto-redirect after 3 seconds
            setTimeout(() => {
                setStorage({ hasCompletedOnboarding: true }).then(() => {
                    onboardingView.classList.add('hidden');
                    // Skip setup view, go straight to main view (Gemini tab will show Auth Card)
                    mainView.classList.remove('hidden');
                    document.getElementById('results-container').classList.remove('hidden');
                    switchTab('gemini-section');

                    // Check for auto-summarize
                    getStorage(['autoSummarizeEnabled']).then(latest => {
                        if (latest.autoSummarizeEnabled !== false) {
                            showDebugMessage('Auto-Summarize Triggered');
                            EventBus.emit('trigger:explanation');
                        }
                    });
                });
            }, 3000);
            return; // Stop here
        }

        // Returning user or already setup
        setupView.classList.add('hidden');
        onboardingView.classList.add('hidden');
        mainView.classList.remove('hidden');

        document.getElementById('results-container').classList.remove('hidden');

        // Trigger Auth Check for default tab
        switchTab('gemini-section');

        // Check for pending explanation
        if (result.pending_explanation) {
            showDebugMessage(' Explaining Selected Text...');
            const input = document.getElementById('main-chat-input');

            chrome.storage.local.remove('pending_explanation');

            setTimeout(() => {
                if (input) {
                    input.value = `Explain "${result.pending_explanation}" in reference to the page content.`;
                    // Trigger
                    const activeSec = document.querySelector('.active-section') || document.getElementById('gemini-section');
                    if (activeSec) {
                        const service = activeSec.id.replace('-section', '');
                        triggerFollowUpChat(service, input.value);
                        setTimeout(() => input.value = '', 100);
                    }
                }
            }, 800);
        } else if (!result.updating_key) {
            // Auto-summarize check
            setTimeout(() => {
                getStorage(['updating_key', 'autoSummarizeEnabled']).then(latest => {
                    const isAutoSummarizeEnabled = latest.autoSummarizeEnabled !== false;
                    // Checking view visibility again in case it changed
                    const isOnOnboarding = !onboardingView.classList.contains('hidden');
                    const isOnSetup = !setupView.classList.contains('hidden');

                    if (!latest.updating_key && isAutoSummarizeEnabled && !isOnOnboarding && !isOnSetup) {
                        showDebugMessage('Auto-Summarize Triggered');
                        EventBus.emit('trigger:explanation');
                    }
                });
            }, 500);
        }
    });
}
