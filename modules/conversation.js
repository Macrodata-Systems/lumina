/**
 * Lumina - AI Copilot for the Web
 * Copyright (c) 2026 Harsh Raj Singh. All Rights Reserved.
 * Proprietary and Confidential.
 */

import { API_CONFIG } from '../config.js';
import { callGemini } from '../services/gemini.js';
import { callOpenAI } from '../services/openai.js';
import { callAnthropic } from '../services/anthropic.js';
import { callDeepSeek } from '../services/deepseek.js';
import { callGrok } from '../services/xai.js';
import { callOpenRouter } from '../services/openrouter.js';
import { callGroq } from '../services/groq.js';

import { MODEL_KEY_MAP } from './constants.js';
import { getStorage, setStorage } from './storage.js';
import { getAllKeys, getKeyNameFromSection } from './keys.js';
import { updateLastActivity } from './session.js';
import { captureTab, extractFollowUps } from './utils.js';
import { renderChatMessage, updateChips, showDebugMessage } from './ui.js';
import { EventBus } from './events.js';
import { saveToHistory } from './history.js';
import { searchMemory } from './rag.js';

// Conversation History
export const conversationHistory = {
    gemini: [],
    openai: [],
    anthropic: [],
    grok: [],
    deepseek: [],
    openrouter: [],
    groq: []
};

/**
 * Handle API Error
 */
function handleApiError(err, sectionId, keyName) {
    console.error(`API Error (${sectionId}):`, err);
    let msg = err.message || "Unknown error occurred.";
    if (typeof msg === 'object') msg = JSON.stringify(msg);

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

    if (isCritical || msg.toLowerCase().includes("api key") || msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("quota")) {
        html += `
            <div style="margin-top: 10px;">
                <button class="update-key-btn icon-action-btn" data-section="${sectionId}" data-key="${keyName}" style="width: auto; padding: 5px 10px; font-size: 0.8rem; border: 1px solid var(--border-color); border-radius: 6px; background: rgba(255,255,255,0.05);">
                    <i class="fa-solid fa-key" style="margin-right: 5px;"></i> Update API Key
                </button>
            </div>
        `;
    }

    renderChatMessage('assistant', html, sectionId, null, null, true);
}

/**
 * Trigger a chat request
 * @param {string} service - Service name (e.g. 'gemini')
 * @param {string} message - User query
 * @param {boolean} forceScreenshot - Whether to force a screenshot capture
 */
export async function triggerFollowUpChat(service, message, forceScreenshot = false) {
    updateLastActivity();

    const sectionId = `${service}-section`;

    if (message.startsWith('/save ')) {
        const fileName = message.replace('/save ', '').trim();
        if (fileName && conversationHistory[service].length > 0) {
            const lastMsg = [...conversationHistory[service]].reverse().find(m => m.role === 'assistant');
            if (lastMsg) {
                try {
                    // Quick import of FileSystem
                    const { FileSystem } = await import('../os/filesystem.js');
                    const fs = new FileSystem();
                    await fs.init();

                    const finalPath = fileName.startsWith('/') ? fileName : '/' + fileName;
                    await fs.writeFile(finalPath, lastMsg.content, 'text/markdown');

                    renderChatMessage('user', message, sectionId, null);
                    renderChatMessage('assistant', `✅ Successfully saved the last response to Finder as **${finalPath}**.\n\nOpen the \`Finder\` app from the OS dock to view it.`, sectionId);

                    // Refresh Finder if it's currently open
                    if (window.luminaKernel && window.luminaKernel.apps['finder']) {
                        window.luminaKernel.apps['finder'].refresh();
                    }

                    saveToHistory(message, `Saved artifact to FileSystem: ${finalPath}`, service.toUpperCase());
                } catch (e) {
                    renderChatMessage('assistant', `❌ Failed to save file: ${e.message}`, sectionId);
                }
                return; // halt chat generation
            }
        }

        renderChatMessage('assistant', `❌ No previous response found to save, or invalid filename.`, sectionId);
        return; // halt chat generation
    }

    // Capture Screenshot (if forced or enabled globally)
    let screenshotData = null;
    const shouldCapture = forceScreenshot || window.useScreenshot;

    if (shouldCapture) {
        const cachedScreenshot = window.sessionStorage.getItem('temp_screenshot_url');
        if (cachedScreenshot) {
            try {
                const parsed = JSON.parse(cachedScreenshot);
                screenshotData = Array.isArray(parsed) ? parsed : cachedScreenshot;
            } catch (e) {
                screenshotData = cachedScreenshot;
            }
            window.sessionStorage.removeItem('temp_screenshot_url'); // Consume it
        } else {
            // showDebugMessage('Attempting to capture screenshot...');
            try {
                screenshotData = await captureTab();
                // showDebugMessage('Screenshot captured successfully.');
            } catch (err) {
                console.warn("Screenshot capture failed:", err);
                showDebugMessage(`Screenshot capture failed: ${err.message}`);
                renderChatMessage('assistant', `⚠️ Screenshot failed: ${err.message}`, sectionId);
            }
        }
    }

    // Render User Message
    renderChatMessage('user', message, sectionId, screenshotData);

    const typingId = `${service}-typing-${Date.now()}`;
    renderChatMessage('assistant', 'Loading...', sectionId, null, typingId);

    try {
        const keys = await getAllKeys();

        // Populate fallback keys from API_CONFIG if missing in storage (legacy support)
        const combinedKeys = {
            geminiKey: keys.geminiKey || API_CONFIG.geminiKey,
            openaiKey: keys.openaiKey || API_CONFIG.openaiKey,
            anthropicKey: keys.anthropicKey || API_CONFIG.anthropicKey,
            grokKey: keys.grokKey || API_CONFIG.grokKey,
            deepseekKey: keys.deepseekKey || API_CONFIG.deepseekKey,
            openrouterKey: keys.openrouterKey || API_CONFIG.openrouterKey,
            groqKey: keys.groqKey || API_CONFIG.groqKey
        };

        const inputContainer = document.querySelector('.chat-input-container');
        if (inputContainer) inputContainer.classList.add('processing');

        const keyName = getKeyNameFromSection(sectionId);
        const apiKey = combinedKeys[keyName];

        // Memory Retrieval (RAG)
        let memoryContext = "";
        if (window.useMemory && combinedKeys.geminiKey) {
            try {
                const memories = await searchMemory(message, combinedKeys.geminiKey, 3);
                if (memories && memories.length > 0) {
                    memoryContext = "\n\n[RELEVANT MEMORY from Knowledge Base]:\n" +
                        memories.map(m => `- ${m.text}`).join('\n') +
                        "\n[End Memory]\n";
                }
            } catch (e) {
                console.warn("Memory search failed during chat:", e);
            }
        }

        // Augmented Prompt
        const augmentedMessage = message + memoryContext + `\n\nAlso provide 3 short, relevant follow-up questions. Format them as a JSON list at the end: :::JSON[...]:::`;

        conversationHistory[service].push({ role: 'user', content: augmentedMessage });

        let response = "";

        if (service === 'gemini') {
            if (!apiKey) throw new Error('Missing API Key');
            response = await callGemini(apiKey, screenshotData, augmentedMessage, conversationHistory.gemini);
        } else if (service === 'openai') {
            response = await callOpenAI(apiKey, screenshotData, augmentedMessage, conversationHistory.openai);
        } else if (service === 'anthropic') {
            response = await callAnthropic(apiKey, screenshotData, augmentedMessage, conversationHistory.anthropic);
        } else if (service === 'grok') {
            response = await callGrok(apiKey, screenshotData, augmentedMessage, conversationHistory.grok);
        } else if (service === 'deepseek') {
            let finalContent = "";
            // Assuming callDeepSeek supports callback or promise. 
            // Based on sidepanel.js logic:
            await callDeepSeek(apiKey, screenshotData, augmentedMessage, (partial) => {
                if (partial.content) finalContent += partial.content;
            });
            response = finalContent || "No response generated.";
        } else if (service === 'openrouter') {
            response = await callOpenRouter(apiKey, screenshotData, augmentedMessage, conversationHistory.openrouter);
        } else if (service === 'groq') {
            response = await callGroq(apiKey, screenshotData, augmentedMessage, conversationHistory.groq);
        }

        if (inputContainer) inputContainer.classList.remove('processing');

        // Extract Follow-ups
        const { cleanText, suggestions } = extractFollowUps(response);
        updateChips(suggestions);
        response = cleanText;

        // Remove typing indicator
        const typingIndicator = document.getElementById(typingId);
        if (typingIndicator) typingIndicator.remove();

        renderChatMessage('assistant', response, sectionId);
        conversationHistory[service].push({ role: 'assistant', content: response });
        saveToHistory(message, response, service.toUpperCase());

    } catch (err) {
        const inputContainer = document.querySelector('.chat-input-container');
        if (inputContainer) inputContainer.classList.remove('processing');

        const typingIndicator = document.getElementById(typingId);
        if (typingIndicator) typingIndicator.remove();

        handleApiError(err, sectionId, getKeyNameFromSection(sectionId));
    }
}

// Event Listeners
EventBus.on('suggestion:clicked', ({ service, prompt }) => {
    triggerFollowUpChat(service, prompt);
});

EventBus.on('conversation:clear', (service) => {
    console.log(`[DEBUG] conversation:clear event received for ${service}`);
    if (conversationHistory[service]) {
        conversationHistory[service] = [];
        console.log(`[DEBUG] History cleared for ${service}. New length: ${conversationHistory[service].length}`);
    }
});
