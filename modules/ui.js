import { AI_MODELS } from './constants.js';
import { setStorage, removeStorage } from './storage.js';
import { extractFollowUps, formatMarkdown } from './utils.js';
import { EventBus } from './events.js';

/**
 * Show a temporary toast message for debugging or feedback
 * @param {string} msg - Message to display
 */
export function showDebugMessage(msg) {
    let container = document.getElementById('debug-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'debug-toast-container';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            flex-direction: column;
            gap: 10px;
            z-index: 10000;
            pointer-events: none;
            align-items: center;
        `;
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'debug-toast';
    toast.textContent = msg;

    // Ensure toast itself doesn't have fixed positioning if it did before
    toast.style.position = 'relative';
    toast.style.bottom = 'auto';
    toast.style.left = 'auto';
    toast.style.transform = 'none';
    toast.style.marginBottom = '0';

    container.appendChild(toast);

    // Trigger reflow
    void toast.offsetWidth;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
            if (container.children.length === 0) {
                container.remove();
            }
        }, 300);
    }, 4000);
}

/**
 * Show loading state for a specific container
 * @param {string} containerId - ID of input container
 */
export function showLoadingState(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.classList.add('processing');
    }
}

/**
 * Hide loading state
 * @param {string} containerId 
 */
export function hideLoadingState(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.classList.remove('processing');
    }
}

/**
 * Remove typing indicator from chat
 * @param {string} sectionId 
 */
export function removeTypingIndicator(sectionId) {
    const chatContainer = document.querySelector(`#${sectionId} .chat-container`);
    if (chatContainer) {
        const lastMessage = chatContainer.lastElementChild;
        if (lastMessage && lastMessage.textContent.includes('...')) {
            lastMessage.remove();
        }
    }
}

/**
 * Setup the global chat footer interface
 */
export function setupChatInterface() {
    const footer = document.getElementById('global-chat-footer');
    if (!footer) return;

    const clearBtn = footer.querySelector('.chat-clear-btn');
    if (clearBtn) {
        // Clone to remove old listeners
        const newClearBtn = clearBtn.cloneNode(true);
        clearBtn.parentNode.replaceChild(newClearBtn, clearBtn);

        newClearBtn.addEventListener('click', () => {
            const activeSec = document.querySelector('.active-section');
            if (!activeSec) return;
            const service = activeSec.id.replace('-section', '');

            // Emit event to clear history
            EventBus.emit('conversation:clear', service);

            // Clear UI
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

    const refreshBtns = footer.parentNode.querySelectorAll('.refresh-btn');
    refreshBtns.forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', () => {
            const target = newBtn.getAttribute('data-target');
            showDebugMessage(`Refreshing ${target}...`);
            // Emit event to re-trigger last message
            EventBus.emit('trigger:refresh', target);
        });
    });
}

/**
 * Update follow-up chips
 * @param {string[]} suggestions 
 */
export function updateChips(suggestions) {
    if (!suggestions || suggestions.length === 0) return;

    const chipsContainers = document.querySelectorAll('.chips-footer .chips');

    chipsContainers.forEach(container => {
        // Clear if not static prompts
        const hasPrompts = container.querySelector('[data-prompt]');
        if (hasPrompts || container.children.length === 0) {
            container.innerHTML = '';

            suggestions.forEach(s => {
                let text = s;
                // Handle object format (e.g. from JSON)
                if (typeof s === 'object' && s !== null) {
                    text = s.question || s.prompt || s.text || JSON.stringify(s);
                }

                // Safety check
                if (typeof text !== 'string') text = String(text);

                const btn = document.createElement('button');
                btn.className = 'chip';
                btn.setAttribute('data-prompt', text);
                btn.title = text;
                btn.textContent = text.length > 25 ? text.substring(0, 25) + '...' : text;

                btn.addEventListener('click', () => {
                    const promptInput = document.getElementById('main-chat-input');
                    if (promptInput) {
                        promptInput.value = text;
                        const activeSec = document.querySelector('.active-section');
                        if (activeSec) {
                            const service = activeSec.id.replace('-section', '');
                            EventBus.emit('suggestion:clicked', { service, prompt: text });
                            setTimeout(() => promptInput.value = '', 100);
                        }
                    }
                });

                container.appendChild(btn);
            });
        }
    });
}

/**
 * Render a chat message
 */
export function renderChatMessage(role, content, sectionId, imageUrl = null, messageId = null, isHtml = false) {
    if (window.uiLocks && window.uiLocks[sectionId]) {
        showDebugMessage(`Blocked Content Update for ${sectionId} (Locked)`);
        return;
    }

    const contentDiv = document.querySelector(`#${sectionId} .content`);
    if (!contentDiv) return;

    let chatContainer = contentDiv.querySelector('.chat-container');
    if (!chatContainer) {
        chatContainer = document.createElement('div');
        chatContainer.className = 'chat-container';
        // Only clear if it's not already a chat container or auth view
        // If content is empty or has empty-state, clear it
        if (!contentDiv.querySelector('.chat-container') && !contentDiv.querySelector('.auth-card')) {
            contentDiv.innerHTML = '';
            contentDiv.appendChild(chatContainer);
        } else if (contentDiv.querySelector('.empty-state')) {
            contentDiv.innerHTML = '';
            contentDiv.appendChild(chatContainer);
        }
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

    const formattedContent = (isHtml || content === '...' || content === '') ? content : formatMarkdown(content);

    if (imageHtml) {
        messageDiv.innerHTML = `
            <div class="message-bubble">
                ${imageHtml}
                ${formattedContent}
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-bubble">
                <button class="copy-message-btn" title="Copy text"><i class="fa-regular fa-copy"></i></button>
                ${formattedContent}
            </div>
        `;

        const copyBtn = messageDiv.querySelector('.copy-message-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const textToCopy = content.replace(/<[^>]*>/g, '');
                navigator.clipboard.writeText(textToCopy).then(() => {
                    const icon = copyBtn.querySelector('i');
                    icon.className = 'fa-solid fa-check';
                    setTimeout(() => {
                        icon.className = 'fa-regular fa-copy';
                    }, 2000);
                });
            });
        }
    }

    requestAnimationFrame(() => {
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
}

/**
 * Update section content completely
 * @param {string} id - Section ID
 * @param {string} text - Content HTML
 */
export function updateSection(id, text) {
    if (window.uiLocks && window.uiLocks[id]) {
        console.warn(`[Gatekeeper] updateSection BLOCKED for ${id}`);
        showDebugMessage(`Blocked Content Update for ${id}`);
        return;
    }

    const contentDiv = document.querySelector(`#${id} .content`);
    if (contentDiv) {
        contentDiv.innerHTML = text;
        requestAnimationFrame(() => {
            contentDiv.scrollTo({ top: contentDiv.scrollHeight, behavior: 'smooth' });
        });
    }
}

/**
 * Render the Auth Card for API key setup
 */
export function renderAuthCard(section, tabId, keyName, preShowSetup = false, onSuccess = null) {
    const contentDiv = section.querySelector('.content');
    if (!contentDiv) return;

    const header = section.querySelector('.section-header');
    if (header) header.style.display = 'none';

    const modelKey = Object.keys(AI_MODELS).find(key => AI_MODELS[key].keyStorageName === keyName);
    const modelConfig = modelKey ? AI_MODELS[modelKey] : null;

    if (!modelConfig) {
        console.error(`No configuration found for key: ${keyName}`);
        return;
    }

    const { displayName, providerName, iconClass, keyUrl, instructions } = modelConfig;
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

    // Add Listeners
    setTimeout(() => {
        const authCard = section.querySelector('.auth-card');
        if (!authCard) return;

        const getKeyBtn = authCard.querySelector(`#get-key-btn-${keyName}`);
        const showDirectBtn = authCard.querySelector(`#show-input-direct-${keyName}`);
        const goBackBtn = authCard.querySelector(`#go-back-auth-${keyName}`);
        const setupGetKeyBtn = authCard.querySelector(`#setup-get-key-btn-${keyName}`);

        const introDiv = authCard.querySelector(`#auth-intro-${keyName}`);
        const setupDiv = authCard.querySelector(`#auth-setup-sec-${keyName}`);

        const showSetup = () => {
            if (introDiv) introDiv.classList.add('hidden');
            if (setupDiv) {
                setupDiv.classList.remove('hidden');
                const input = setupDiv.querySelector('input');
                if (input) input.focus();
            }
        };

        const showIntro = () => {
            if (introDiv) introDiv.classList.remove('hidden');
            if (setupDiv) setupDiv.classList.add('hidden');
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
                removeStorage(['updating_key']);
                if (window.uiLocks) window.uiLocks[tabId] = false;
                showIntro();
            });
        }

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

                setStorage(saveObj).then(() => {
                    removeStorage(['updating_key']);
                    if (window.uiLocks) window.uiLocks[tabId] = false;
                    if (header) header.style.display = '';
                    contentDiv.innerHTML = `
                        <div class="empty-state">
                            <div style="font-size: 2rem; margin-bottom: 10px;">✨</div>
                            <p><strong>${displayName} is connected!</strong></p>
                            <p style="font-size: 0.9rem; opacity: 0.8;">Ready to process your requests.</p>
                        </div>
                    `;
                    // The instruction had an 'if (footerPrompt)' block here, but it was syntactically incorrect
                    // to place it directly inside the template literal. Assuming it was meant to be
                    // executed after setting innerHTML, or was a placeholder for dynamic content.
                    // As per the instruction, I'm adding the `if (footerPrompt)` block outside the template literal.
                    const footerPrompt = document.getElementById("global-chat-footer"); if (footerPrompt) {
                        footerPrompt.classList.remove('hidden');
                    }

                    // Emit event for global listeners (e.g., auto-summarize)
                    EventBus.emit('key:connected', { keyName, value: val });

                    if (onSuccess) onSuccess(val);
                });
            });

            keyInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') confirmBtn.click();
            });
        }
    }, 50);
}

/**
 * Apply theme to the document
 */
export function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const themeToggleBtn = document.getElementById('theme-toggle');

    // Update Icon: Sun for Dark Mode (to switch to light), Moon for Light Mode
    if (themeToggleBtn) {
        if (theme === 'dark') {
            themeToggleBtn.innerHTML = '☀️';
        } else {
            themeToggleBtn.innerHTML = '🌙';
        }
    }
}
