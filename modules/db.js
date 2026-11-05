/**
 * Lumina - AI Copilot for the Web
 * Copyright (c) 2026 Harsh Raj Singh. All Rights Reserved.
 * Proprietary and Confidential.
 */

const DB_NAME = 'LuminaMemory';
const DB_VERSION = 1;

/**
 * Open the IndexedDB database
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => reject(`Database error: ${event.target.error}`);

        request.onsuccess = (event) => resolve(event.target.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Store for full Documents (Metadata)
            if (!db.objectStoreNames.contains('documents')) {
                const docStore = db.createObjectStore('documents', { keyPath: 'id' });
                docStore.createIndex('url', 'url', { unique: false });
                docStore.createIndex('timestamp', 'timestamp', { unique: false });
            }

            // Store for Vector Chunks
            if (!db.objectStoreNames.contains('chunks')) {
                const chunkStore = db.createObjectStore('chunks', { keyPath: 'id' });
                chunkStore.createIndex('docId', 'docId', { unique: false });
                // We can't index arrays (vectors) easily in IDB, we'll scan them in memory for now
                // or use a specialized index if needed later.
            }
        };
    });
}

/**
 * Store a document and its chunks
 * @param {Object} doc - { id, url, title, timestamp }
 * @param {Array} chunks - Array of { id, docId, text, vector }
 */
export async function storeDocument(doc, chunks) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['documents', 'chunks'], 'readwrite');

        transaction.oncomplete = () => resolve();
        transaction.onerror = (event) => reject(event.target.error);

        const docStore = transaction.objectStore('documents');
        const chunkStore = transaction.objectStore('chunks');

        // 1. Store Document Metadata
        docStore.put(doc);

        // 2. Store Chunks
        chunks.forEach(chunk => {
            chunkStore.put(chunk);
        });
    });
}

/**
 * GetAllChunks for vector search
 * (Start simple: load all into memory. For <10k chunks this is fine in JS)
 * @returns {Promise<Array>}
 */
export async function getAllChunks() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['chunks'], 'readonly');
        const store = transaction.objectStore('chunks');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

/**
 * Get all document metadata
 * @returns {Promise<Array>}
 */
export async function getAllDocuments() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['documents'], 'readonly');
        const store = transaction.objectStore('documents');
        const request = store.getAll(); // Returns sorted by ID by default

        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

/**
 * Delete a document and its chunks
 * @param {string} docId 
 */
export async function deleteDocument(docId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['documents', 'chunks'], 'readwrite');

        transaction.oncomplete = () => resolve();
        transaction.onerror = (e) => reject(e.target.error);

        // Delete Doc
        transaction.objectStore('documents').delete(docId);

        // Delete Chunks (Need to find them first)
        // Ideally we'd use a cursor or index, but for now let's iterate or use index
        const chunkStore = transaction.objectStore('chunks');
        const index = chunkStore.index('docId');
        const request = index.getAllKeys(docId);

        request.onsuccess = () => {
            const keys = request.result;
            keys.forEach(key => {
                chunkStore.delete(key);
            });
        };
    });
}
