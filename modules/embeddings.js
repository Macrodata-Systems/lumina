/**
 * Lumina - AI Copilot for the Web
 * Copyright (c) 2026 Harsh Raj Singh. All Rights Reserved.
 * Proprietary and Confidential.
 */

const EMBEDDING_MODELS = [
    { name: 'text-embedding-004', version: 'v1beta' },
    { name: 'text-embedding-004', version: 'v1' },
    { name: 'gemini-embedding-001', version: 'v1beta' },
    { name: 'gemini-embedding-001', version: 'v1' }
];

/**
 * Helper to try a specific model
 */
async function tryEmbedding(text, apiKey, modelConfig) {
    const { name, version } = modelConfig;
    const url = `https://generativelanguage.googleapis.com/${version}/models/${name}:embedContent?key=${apiKey}`;

    const payload = {
        model: `models/${name}`,
        content: {
            parts: [{ text: text }]
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `Failed on ${name}`);
    }

    const data = await response.json();
    return data.embedding.values;
}

/**
 * Get Embeddings with Fallback
 * Iterates through models until one works.
 * @param {string} text 
 * @param {string} apiKey 
 * @returns {Promise<Array<number>>} The vector embedding
 */
export async function getEmbedding(text, apiKey) {
    let lastError = null;

    for (const modelConfig of EMBEDDING_MODELS) {
        try {
            // console.log(`Trying embedding model: ${modelConfig.name} (${modelConfig.version})...`);
            return await tryEmbedding(text, apiKey, modelConfig);
        } catch (error) {
            console.warn(`Model ${modelConfig.name} failed:`, error.message);
            lastError = error;
            // Continue to next model
        }
    }

    console.error("All embedding models failed.");
    throw lastError || new Error("All embedding models failed.");
}

/**
 * Helper for batch embedding
 */
async function tryBatchEmbedding(texts, apiKey, modelConfig) {
    const { name, version } = modelConfig;
    const url = `https://generativelanguage.googleapis.com/${version}/models/${name}:batchEmbedContents?key=${apiKey}`;

    const requests = texts.map(t => ({
        model: `models/${name}`,
        content: { parts: [{ text: t }] }
    }));

    const payload = { requests };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `Batch failed on ${name}`);
    }

    const data = await response.json();
    return data.embeddings.map(e => e.values);
}

/**
 * Batch Embeddings with Fallback
 */
export async function getBatchEmbeddings(texts, apiKey) {
    let lastError = null;

    for (const modelConfig of EMBEDDING_MODELS) {
        try {
            return await tryBatchEmbedding(texts, apiKey, modelConfig);
        } catch (error) {
            console.warn(`Batch Model ${modelConfig.name} failed:`, error.message);
            lastError = error;
        }
    }

    throw lastError || new Error("All batch embedding models failed.");
}
