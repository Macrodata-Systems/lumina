/**
 * Lumina - AI Copilot for the Web
 * Copyright (c) 2026 Harsh Raj Singh. All Rights Reserved.
 * Proprietary and Confidential.
 */

import { getStorage, setStorage } from './storage.js';
import { formatMarkdown } from './utils.js';
import { EventBus } from './events.js';

export let historyData = [];

/**
 * Initialize history from storage
 */
export async function initHistory() {
    const res = await getStorage(['history']);
    historyData = res.history || [];
}

/**
 * Save chat item to global history
 */
export async function saveToHistory(prompt, response, service) {
    if (!prompt || !response) return;

    const newItem = {
        id: Date.now(),
        date: new Date().toISOString(),
        prompt: prompt,
        response: response,
        service: service
    };

    historyData = [newItem, ...(historyData || [])];

    // Limit to 50 items
    if (historyData.length > 50) {
        historyData = historyData.slice(0, 50);
    }

    await setStorage({ history: historyData });
}

/**
 * Render history items list
 */
export function renderHistoryItems(container, items = null) {
    if (!container) return;

    const list = items || historyData || [];

    container.innerHTML = '';
    if (!list || list.length === 0) {
        container.innerHTML = '<div class="empty-state">No history yet. Start explaining things!</div>';
        return;
    }

    // Use Delegation instead of per-item listeners
    // (Listeners are attached to container in renderHistory, or we just attach once)
    // Actually, let's just make the item not clickable directly, but handle it in the container logic
    // OR just use per-item with stopPropagation which is safer for now.

    list.forEach(item => {
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

        el.addEventListener('click', (e) => {
            e.stopPropagation(); // Stop bubbling

            // Double check visibility
            if (container.offsetParent === null) {
                console.warn("Blocked hidden history click");
                return;
            }

            let sectionId = item.service.toLowerCase() + '-section';
            if (item.service === 'ChatGPT') sectionId = 'openai-section';
            if (item.service === 'Claude') sectionId = 'anthropic-section';
            if (item.service === 'Gemini') sectionId = 'gemini-section';
            if (item.service === 'Grok') sectionId = 'grok-section';
            if (item.service === 'DeepSeek') sectionId = 'deepseek-section';

            console.log(`[DEBUG] History Item Clicked: ${sectionId}`);

            // Emit event to navigate and show this item
            EventBus.emit('history:click', {
                sectionId: sectionId,
                response: item.response
            });
        });
        container.appendChild(el);
    });
}

/**
 * Render main history view
 */
export function renderHistory() {
    const container = document.querySelector('.history-list-container');
    renderHistoryItems(container);
}

/**
 * Clear all history
 */
export async function clearAllHistory() {
    if (confirm('Clear all history?')) {
        historyData = [];
        await setStorage({ history: [] });
        renderHistory();
    }
}
