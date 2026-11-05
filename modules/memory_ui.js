/**
 * Lumina - AI Copilot for the Web
 * Copyright (c) 2026 Harsh Raj Singh. All Rights Reserved.
 * Proprietary and Confidential.
 */

import { getAllDocuments, deleteDocument } from './db.js';
import { searchMemory, memorizePage } from './rag.js';
import { getStorage } from './storage.js';
import { extractTextFromDocument } from '../services/gemini.js';

export async function renderMemory() {
    const container = document.querySelector('#memory-section .memory-list-container');
    if (!container) return;

    try {
        const docs = await getAllDocuments();

        if (docs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 2rem; margin-bottom: 10px;">🧠</div>
                    <p><strong>Memory is Empty</strong></p>
                    <p style="font-size: 0.9rem; opacity: 0.8;">Click the brain icon above to memorize pages.</p>
                </div>
            `;
            return;
        }

        // Sort by timestamp desc
        docs.sort((a, b) => b.timestamp - a.timestamp);

        let html = '';
        docs.forEach(doc => {
            const date = new Date(doc.timestamp).toLocaleDateString();
            const time = new Date(doc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            html += `
                <div class="memory-item" data-id="${doc.id}">
                    <div class="memory-icon">📄</div>
                    <div class="memory-details">
                        <div class="memory-title" title="${doc.title}">${doc.title || 'Untitled Page'}</div>
                        <div class="memory-meta">
                            <span>${date} ${time}</span> • <span>${doc.chunkCount} chunks</span>
                        </div>
                        <div class="memory-url" title="${doc.url}">${new URL(doc.url).hostname}</div>
                    </div>
                    <button class="delete-memory-btn" data-id="${doc.id}" title="Forget this page">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            `;
        });

        container.innerHTML = html;

        // Add Delete Listeners
        container.querySelectorAll('.delete-memory-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm('Forget this page? This cannot be undone.')) {
                    const id = btn.getAttribute('data-id');
                    await deleteDocument(id);
                    renderMemory(); // Re-render
                }
            });
        });

    } catch (e) {
        console.error(e);
        container.innerHTML = `<div class="error-state">Error loading memory: ${e.message}</div>`;
    }
}

export function initMemoryUI() {
    // Refresh Button
    const refreshBtn = document.getElementById('refresh-memory-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            document.getElementById('memory-search-input').value = ''; // Clear search
            renderMemory();
        });
    }

    // Search Input
    const searchInput = document.getElementById('memory-search-input');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            clearTimeout(debounceTimer);

            debounceTimer = setTimeout(async () => {
                if (query.length < 3) {
                    if (query.length === 0) renderMemory();
                    return;
                }

                // Perform Search
                const container = document.querySelector('#memory-section .memory-list-container');
                container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-circle-notch fa-spin"></i> Searching...</div>';

                try {
                    const { geminiKey: apiKey } = await getStorage(['geminiKey']);
                    if (!apiKey) {
                        container.innerHTML = '<div class="error-state">Gemini API Key required for search.</div>';
                        return;
                    }

                    const results = await searchMemory(query, apiKey, 5); // Top 5

                    if (results.length === 0) {
                        container.innerHTML = '<div class="empty-state">No matching memories found.</div>';
                        return;
                    }

                    let html = '<div class="search-results-header">Top Matches</div>';
                    results.forEach(chunk => {
                        const scorePct = Math.round(chunk.score * 100);
                        html += `
                            <div class="memory-item search-result">
                                <div class="memory-details">
                                    <div class="memory-text-snippet">"...${chunk.text}..."</div>
                                    <div class="memory-meta">
                                        <span>Match: ${scorePct}%</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                    container.innerHTML = html;

                } catch (err) {
                    console.error(err);
                    container.innerHTML = `<div class="error-state">Search failed: ${err.message}</div>`;
                }

            }, 600); // 600ms debounce
        });
    }
    setupFileUpload();
}

/**
 * Setup File Upload Feature
 */
function setupFileUpload() {
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('file-upload-input');

    if (!uploadBtn || !fileInput) return;

    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Reset input so same file can be selected again
        e.target.value = '';

        // Visual Feedback
        const originalIcon = uploadBtn.innerHTML;
        uploadBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
        uploadBtn.disabled = true;

        try {
            const { geminiKey: apiKey } = await getStorage(['geminiKey']);
            if (!apiKey) {
                throw new Error('Please add a Gemini API Key in settings first.');
            }

            let text = '';

            // If it's a simple text-based file, read it directly
            if (file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.csv') || file.type.startsWith('text/')) {
                text = await readFileAsText(file);
            } else {
                // Use Gemini 2.5 Multimodal to extract text from images, PDFs, etc.
                const base64Data = await readFileAsDataURL(file);
                const mimeType = file.type || 'application/octet-stream';
                text = await extractTextFromDocument(apiKey, base64Data, mimeType);
            }

            if (!text || text.length < 10) {
                throw new Error('File is empty or no text could be extracted.');
            }

            // Construct exact "Page" object structure expected by RAG
            const mockPage = {
                title: file.name,
                url: `file://${file.name}`, // Pseudo URL
                content: text
            };

            await memorizePage(mockPage, apiKey);

            // Success
            renderMemory();
            alert('File added to Knowledge Base!');

        } catch (error) {
            console.error('File Upload Error:', error);
            alert(`Upload Failed: ${error.message}`);
        } finally {
            uploadBtn.innerHTML = originalIcon;
            uploadBtn.disabled = false;
        }
    });
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}
