/**
 * Lumina - AI Copilot for the Web
 * Copyright (c) 2026 Harsh Raj Singh. All Rights Reserved.
 * Proprietary and Confidential.
 */

/**
 * Session management constants
 */
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Update the last activity timestamp
 */
export function updateLastActivity() {
    chrome.storage.local.set({ lastActivity: Date.now() });
}

/**
 * Check and clear expired session data
 */
export function checkSessionExpiry() {
    chrome.storage.local.get(['lastActivity'], (result) => {
        const lastActivity = result.lastActivity || 0;
        const now = Date.now();

        if (lastActivity > 0 && now - lastActivity > SESSION_TIMEOUT) {
            clearExpiredSessionData();
        }
    });
}

/**
 * Clear all storage except API keys and essential settings
 */
export function clearExpiredSessionData() {
    chrome.storage.local.get(null, (allData) => {
        // Extract keys to keep
        const keysToKeep = {
            geminiKey: allData.geminiKey || '',
            openaiKey: allData.openaiKey || '',
            anthropicKey: allData.anthropicKey || '',
            grokKey: allData.grokKey || '',
            deepseekKey: allData.deepseekKey || '',
            openrouterKey: allData.openrouterKey || '',
            groqKey: allData.groqKey || '',
            theme: allData.theme || 'dark', // Keep theme
            autoSummarizeEnabled: allData.autoSummarizeEnabled !== false, // Keep preference
            hasCompletedOnboarding: allData.hasCompletedOnboarding || false // Keep onboarding status
        };

        // Clear everything
        chrome.storage.local.clear(() => {
            // Restore keys
            chrome.storage.local.set(keysToKeep, () => {
                console.log("[Lumina] Session expired. Cache cleared, keys preserved.");
            });
        });
    });
}
