/**
 * Lumina - AI Copilot for the Web
 * Copyright (c) 2026 Harsh Raj Singh. All Rights Reserved.
 * Proprietary and Confidential.
 */

/**
 * Helper to get multiple keys from storage
 * @param {string[]} keys - keys to retrieve
 * @returns {Promise<Object>}
 */
export function getStorage(keys) {
    return new Promise((resolve) => {
        chrome.storage.local.get(keys, (result) => {
            resolve(result || {});
        });
    });
}

/**
 * Helper to set keys in storage
 * @param {Object} items - key-value pairs to set
 * @returns {Promise<void>}
 */
export function setStorage(items) {
    return new Promise((resolve) => {
        chrome.storage.local.set(items, () => {
            resolve();
        });
    });
}

/**
 * Helper to remove keys from storage
 * @param {string|string[]} keys - keys to remove
 * @returns {Promise<void>}
 */
export function removeStorage(keys) {
    return new Promise((resolve) => {
        chrome.storage.local.remove(keys, () => {
            resolve();
        });
    });
}
