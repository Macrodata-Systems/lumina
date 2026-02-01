import { API_CONFIG } from '../config.js';
import { getStorage, setStorage, removeStorage } from './storage.js';
import { showDebugMessage, renderAuthCard } from './ui.js';
import { MODEL_KEY_MAP, AI_MODELS } from './constants.js';
import { EventBus } from './events.js';

export function openSettings(focusId = null) {
    const mainView = document.getElementById('main-view');
    const settingsView = document.getElementById('settings-view');
    const settingsBtn = document.getElementById('settings-btn');

    if (mainView) mainView.classList.add('hidden');
    if (settingsView) settingsView.classList.remove('hidden');
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

export function initSettings() {
    const settingsBtn = document.getElementById('settings-btn');
    const backBtn = document.getElementById('back-btn');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const mainView = document.getElementById('main-view');
    const settingsView = document.getElementById('settings-view');

    // Open Settings
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            openSettings();
        });
    }

    // Back Button
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            settingsView.classList.add('hidden');
            mainView.classList.remove('hidden');
            if (settingsBtn) settingsBtn.classList.remove('hidden');
            const headerActions = document.querySelector('.header-actions');
            if (headerActions) headerActions.classList.remove('hidden');
        });
    }

    // Save Settings
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
            saveSettingsBtn.textContent = 'Saving...';

            const geminiKeyInput = document.getElementById('gemini-key');
            const openaiKeyInput = document.getElementById('openai-key');
            const anthropicKeyInput = document.getElementById('anthropic-key');
            const grokKeyInput = document.getElementById('grok-key');
            const deepseekKeyInput = document.getElementById('deepseek-key');

            const keys = {
                geminiKey: geminiKeyInput ? geminiKeyInput.value.trim() : '',
                openaiKey: openaiKeyInput ? openaiKeyInput.value.trim() : '',
                anthropicKey: anthropicKeyInput ? anthropicKeyInput.value.trim() : '',
                grokKey: grokKeyInput ? grokKeyInput.value.trim() : '',
                deepseekKey: deepseekKeyInput ? deepseekKeyInput.value.trim() : ''
            };

            setStorage(keys).then(() => {
                saveSettingsBtn.textContent = 'Save';
                alert('Settings Saved!');
                backBtn.click();
            });
        });
    }

    // Config Buttons Logic (Inline Updates)
    document.querySelectorAll('.config-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetId = btn.getAttribute('data-target');

            // If the button is inside a section, trigger inline auth card
            const section = btn.closest('.result-section');
            if (section) {
                const sectionId = section.id;
                const storageKey = MODEL_KEY_MAP[sectionId];
                if (storageKey) {
                    showDebugMessage(`Update Started: Locking ${sectionId}`);

                    // LOCK UI IMMEDIATELY
                    if (window.uiLocks) window.uiLocks[sectionId] = true;

                    // Set flag for persistence AND wait for it
                    setStorage({ 'updating_key': sectionId }).then(() => {
                        const modelId = Object.keys(AI_MODELS).find(k => AI_MODELS[k].keyStorageName === storageKey);
                        if (modelId) {
                            // Clear history
                            EventBus.emit('conversation:clear', modelId);
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
                showDebugMessage(`Update Link Clicked: Locking ${sectionId}`);

                if (window.uiLocks) window.uiLocks[sectionId] = true;

                renderAuthCard(section, sectionId, keyName, true);

                setStorage({ 'updating_key': sectionId }).then(() => {
                    const modelId = Object.keys(AI_MODELS).find(k => AI_MODELS[k].keyStorageName === keyName);
                    if (modelId) {
                        showDebugMessage(`Opening ${modelId} Website...`);
                        EventBus.emit('conversation:clear', modelId);

                        setTimeout(() => {
                            window.open(AI_MODELS[modelId].keyUrl, '_blank');
                        }, 50);
                    }
                });
            }
        }
    });
}
