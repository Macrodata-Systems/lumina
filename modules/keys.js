import { AI_MODELS, MODEL_KEY_MAP } from './constants.js';
import { getStorage, setStorage } from './storage.js';

/**
 * Get API Key for a specific model section
 * @param {string} sectionId - The section ID (e.g. 'gemini-section')
 * @returns {Promise<string|null>}
 */
export async function getApiKey(sectionId) {
    const keyName = MODEL_KEY_MAP[sectionId];
    if (!keyName) return null;

    const data = await getStorage([keyName]);
    return data[keyName] || null;
}

/**
 * Get all configured API keys
 * @returns {Promise<Object>}
 */
export async function getAllKeys() {
    const keys = Object.values(MODEL_KEY_MAP);
    return await getStorage(keys);
}

/**
 * Check if at least one API key is configured
 * @returns {Promise<boolean>}
 */
export async function hasAnyKey() {
    const keys = await getAllKeys();
    return Object.values(keys).some(key => key && key.length > 0);
}

/**
 * Save an API key
 * @param {string} keyName - The storage key name (e.g. 'geminiKey')
 * @param {string} value - The API key value
 * @returns {Promise<void>}
 */
export async function saveApiKey(keyName, value) {
    if (!value) return;
    const saveObj = {};
    saveObj[keyName] = value.trim();
    await setStorage(saveObj);
}

/**
 * Get key name from section ID
 * @param {string} sectionId 
 * @returns {string|undefined}
 */
export function getKeyNameFromSection(sectionId) {
    return MODEL_KEY_MAP[sectionId];
}
