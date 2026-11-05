/**
 * Lumina - AI Copilot for the Web
 * Copyright (c) 2026 Harsh Raj Singh. All Rights Reserved.
 * Proprietary and Confidential.
 */

import { storeDocument, getAllChunks } from './db.js';
import { getBatchEmbeddings, getEmbedding } from './embeddings.js';

// Configuration
const CHUNK_SIZE = 1000; // Characters roughly
const CHUNK_OVERLAP = 200;

/**
 * Simple text chunker
 * @param {string} text 
 * @returns {string[]}
 */
/**
 * Semantic Chunking for Markdown
 * Splits by headers first, then by paragraphs, then by characters.
 * @param {string} text 
 * @returns {string[]}
 */
function chunkText(text) {
    if (!text) return [];

    const chunks = [];

    // 1. Split by Headers (Level 1-3)
    // Regex to find headers: \n#+ 
    // We want to keep the delimiter to know the header level, but split creates array.
    // Let's use a simpler approach: Split by newline, iterate and build chunks.

    const lines = text.split('\n');
    let currentChunk = [];
    let currentLength = 0;

    for (const line of lines) {
        const isHeader = /^#{1,3}\s/.test(line);
        const lineLen = line.length + 1; // +1 for newline

        // If it's a header and we have content, push current chunk
        if (isHeader && currentChunk.length > 0) {
            pushChunk(currentChunk.join('\n'));
            currentChunk = [line];
            currentLength = lineLen;
        }
        // If adding this line exceeds max size, push metadata safe split
        else if (currentLength + lineLen > CHUNK_SIZE) {
            if (currentChunk.length > 0) {
                pushChunk(currentChunk.join('\n'));
                currentChunk = [];
                currentLength = 0;
            }
            // If the single line is huge, split it by char
            if (lineLen > CHUNK_SIZE) {
                const subChunks = chunkByChar(line);
                chunks.push(...subChunks);
            } else {
                currentChunk.push(line);
                currentLength += lineLen;
            }
        }
        else {
            currentChunk.push(line);
            currentLength += lineLen;
        }
    }

    if (currentChunk.length > 0) {
        pushChunk(currentChunk.join('\n'));
    }

    function pushChunk(content) {
        if (!content || content.trim().length === 0) return;
        // Check if still too large (edge case)
        if (content.length > CHUNK_SIZE * 1.5) {
            chunks.push(...chunkByChar(content));
        } else {
            chunks.push(content.trim());
        }
    }

    return chunks;
}

/**
 * Fallback Text Chunker (Character based)
 */
function chunkByChar(text) {
    const chunks = [];
    let start = 0;
    while (start < text.length) {
        const end = Math.min(start + CHUNK_SIZE, text.length);
        let chunk = text.slice(start, end);
        // Try to break at newline or space
        if (end < text.length) {
            const lastSpace = Math.max(chunk.lastIndexOf('\n'), chunk.lastIndexOf(' '));
            if (lastSpace > CHUNK_SIZE * 0.5) {
                chunk = chunk.slice(0, lastSpace);
                start += (lastSpace + 1 - CHUNK_OVERLAP);
            } else {
                start += (CHUNK_SIZE - CHUNK_OVERLAP);
            }
        } else {
            start += CHUNK_SIZE;
        }
        chunks.push(chunk);
    }
    return chunks;
}

/**
 * Cosine Similarity
 * @param {number[]} vecA 
 * @param {number[]} vecB 
 * @returns {number} -1 to 1
 */
function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Ingest a Page into Memory
 * @param {Object} page - { title, url, content }
 * @param {string} apiKey 
 */
export async function memorizePage(page, apiKey) {
    const docId = crypto.randomUUID();
    const timestamp = Date.now();

    // 1. Chunk
    const textChunks = chunkText(page.content);
    if (textChunks.length === 0) throw new Error("No content to chunk");

    console.log(`[RAG] Chunked into ${textChunks.length} parts.`);

    // 2. Embed (Batch)
    // Gemini batch limit is often 100, so we might need to loop if very large
    // detailed implementations would chunk the batches too.
    // For now assuming < 100 chunks per page (100k chars)

    let vectors = [];
    // Simple batching loop
    const BATCH_SIZE = 50;
    for (let i = 0; i < textChunks.length; i += BATCH_SIZE) {
        const batch = textChunks.slice(i, i + BATCH_SIZE);
        const batchVectors = await getBatchEmbeddings(batch, apiKey);
        vectors.push(...batchVectors);
    }

    // 3. Prepare Objects
    const chunkObjects = textChunks.map((text, i) => ({
        id: `${docId}_${i}`,
        docId: docId,
        text: text,
        vector: vectors[i],
        timestamp: timestamp
    }));

    const docObject = {
        id: docId,
        url: page.url,
        title: page.title,
        timestamp: timestamp,
        chunkCount: textChunks.length
    };

    // 4. Store
    await storeDocument(docObject, chunkObjects);
    return docObject;
}

/**
 * Search Memory
 * @param {string} queryText 
 * @param {string} apiKey 
 * @param {number} topK 
 */
export async function searchMemory(queryText, apiKey, topK = 3) {
    // 1. Embed Query
    const queryVector = await getEmbedding(queryText, apiKey);

    // 2. Fetch All Chunks (Naive Scan)
    // In a real browser extension with < 10MB of text, this is millis.
    const allChunks = await getAllChunks();

    // 3. Rank
    const scored = allChunks.map(chunk => ({
        ...chunk,
        score: cosineSimilarity(queryVector, chunk.vector)
    }));

    // 4. Sort & Slice
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, topK);
}
