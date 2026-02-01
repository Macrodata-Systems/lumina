import { MODEL_KEY_MAP } from './constants.js';
import { getKeyNameFromSection, hasAnyKey } from './keys.js';
import { renderAuthCard, setupChatInterface, renderChatMessage, updateSection, showDebugMessage } from './ui.js';
import { renderHistory } from './history.js';
import { getStorage } from './storage.js';
import { EventBus } from './events.js';

/**
 * Initialize Tab Logic
 */
export function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        // Clone to remove potential duplicate listeners
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', () => {
            const targetId = newBtn.getAttribute('data-tab');
            switchTab(targetId);
        });
    });

    // Initial Tab Setup: Hide everything except Gemini (or default)
    document.querySelectorAll('.result-section').forEach(sec => {
        if (sec.id !== 'gemini-section') {
            sec.style.display = 'none';
            sec.classList.remove('active-section');
        } else {
            sec.style.display = 'block';
            sec.classList.add('active-section');
        }
    });
}

/**
 * Switch to a specific tab/section
 */
export function switchTab(tabId) {
    console.log(`Switching to tab: ${tabId}`);
    const tabBtns = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.result-section');

    tabBtns.forEach(b => {
        if (b.getAttribute('data-tab') === tabId) {
            b.classList.add('active');
        } else {
            b.classList.remove('active');
        }
    });

    // Check if we are coming FROM history-section
    const previousActive = document.querySelector('.active-section');
    console.log(`Previous active section: ${previousActive ? previousActive.id : 'null'}`);

    if (previousActive && previousActive.id === 'history-section' && tabId !== 'history-section') {
        console.log('Exiting History Section - Clearing Target Chat');
        // Refresh the target chat
        const targetService = tabId.replace('-section', '');
        if (targetService) {
            // 1. Clear Data
            EventBus.emit('conversation:clear', targetService);

            // 2. Clear UI (Reset to Ready State)
            const targetSec = document.getElementById(tabId);
            if (targetSec) {
                const contentDiv = targetSec.querySelector('.content');
                if (contentDiv) {
                    console.log(`[DEBUG] Clearing content for ${tabId}. Old length: ${contentDiv.innerHTML.length}`);
                    contentDiv.innerHTML = `
                        <div class="empty-state">
                           <div style="font-size: 2rem; margin-bottom: 10px;">👋</div>
                           <p><strong>Ready!</strong></p>
                           <p style="font-size: 0.9rem; opacity: 0.8;">Ask anything or click a chip above.</p>
                        </div>
                    `;
                    console.log(`[DEBUG] Content cleared. New length: ${contentDiv.innerHTML.length}`);

                    // Double check after 500ms to see if it reverted
                    setTimeout(() => {
                        const currentLen = contentDiv.innerHTML.length;
                        console.log(`[DEBUG] Audit 500ms later: Length is ${currentLen}. (Expected ~350-400)`);
                        if (currentLen > 500) {
                            console.error(`[DEBUG] ALERT: Content was repopulated! Something is restoring the chat.`);
                        }
                    }, 500);
                } else {
                    console.error(`[DEBUG] Content div not found for ${tabId}`);
                }
            } else {
                console.error(`[DEBUG] Target section not found: ${tabId}`);
            }
        }
    }

    sections.forEach(sec => {
        if (sec.id === tabId) {
            sec.style.display = 'block';
            sec.classList.add('active-section');

            // Logic to check keys and show Auth Card if missing
            const requiredKey = MODEL_KEY_MAP[tabId];

            if (requiredKey) {
                // Check if key exists
                getStorage([requiredKey, 'updating_key']).then(res => {
                    const isUpdating = (res.updating_key === tabId);
                    const hasKey = !!res[requiredKey];
                    const contentDiv = sec.querySelector('.content');
                    const header = sec.querySelector('.section-header');
                    const footerPrompt = document.getElementById('global-chat-footer');

                    if (!hasKey || isUpdating) {
                        // Show Auth Card
                        if (footerPrompt) footerPrompt.classList.add('hidden');
                        if (header) header.style.display = 'none';

                        const existingAuthCard = contentDiv?.querySelector('.auth-card');
                        if (!existingAuthCard) {
                            renderAuthCard(sec, tabId, requiredKey, isUpdating);
                        }
                    } else {
                        // Key Exists
                        const existingAuthCard = contentDiv?.querySelector('.auth-card');
                        if (!existingAuthCard && !isUpdating) {
                            if (header) header.style.display = '';

                            if (contentDiv && !contentDiv.innerHTML.trim() || contentDiv.querySelector('.auth-card')) {
                                contentDiv.innerHTML = `
                                    <div class="empty-state">
                                        <div style="font-size: 2rem; margin-bottom: 10px;">👋</div>
                                        <p><strong>Ready!</strong></p>
                                        <p style="font-size: 0.9rem; opacity: 0.8;">Ask anything or click a chip above.</p>
                                    </div>
                                `;
                            }

                            if (footerPrompt) {
                                footerPrompt.classList.remove('hidden');
                                setupChatInterface();
                            }
                        }
                    }
                });
            } else if (tabId === 'history-section') {
                const footerPrompt = document.getElementById('global-chat-footer');
                if (footerPrompt) footerPrompt.classList.add('hidden');
                renderHistory();
            }

        } else {
            sec.style.display = 'none';
            sec.classList.remove('active-section');
        }
    });
}
