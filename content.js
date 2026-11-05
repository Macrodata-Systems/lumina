/**
 * Lumina - AI Copilot for the Web
 * Copyright (c) 2026 Harsh Raj Singh. All Rights Reserved.
 * Proprietary and Confidential.
 */

// Lumina: Content Script Loaded (v1.5 - Stealth Overlay Active)

console.log('Lumina running in Stealth Mode: UI disabled on page body.');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'DISPLAY_SILENT_STATUS' || message.action === 'DISPLAY_SILENT_ANSWER') {
        let container = document.getElementById('lumina-stealth-overlay');

        if (!container) {
            container = document.createElement('div');
            container.id = 'lumina-stealth-overlay';
            // CRITICAL: Prevent focus stealing
            container.tabIndex = -1;
            container.addEventListener('mousedown', (e) => e.preventDefault());

            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                width: 400px;
                max-height: 80vh;
                background: rgba(15, 15, 20, 0.95);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                z-index: 2147483647; /* Max z-index */
                color: white;
                font-family: system-ui, -apple-system, sans-serif;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            `;

            const header = document.createElement('div');
            header.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                background: rgba(255,255,255,0.05);
                border-bottom: 1px solid rgba(255,255,255,0.1);
                cursor: grab;
            `;
            header.innerHTML = `
                <div style="font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                    <div style="width: 8px; height: 8px; background: #75ff8f; border-radius: 50%; box-shadow: 0 0 10px #75ff8f;"></div>
                    Lumina Agent
                </div>
            `;

            const closeBtn = document.createElement('div');
            closeBtn.innerHTML = '×';
            closeBtn.style.cssText = `
                cursor: pointer;
                font-size: 20px;
                color: #888;
                line-height: 1;
                padding: 0 4px;
            `;
            closeBtn.onclick = () => container.remove();

            // Drag logic
            let isDragging = false;
            let startX, startY, initialX, initialY;
            header.onmousedown = (e) => {
                e.preventDefault();
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                const rect = container.getBoundingClientRect();
                initialX = rect.left;
                initialY = rect.top;
            };
            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                container.style.right = 'auto'; // Break 'right' positioning
                container.style.left = `${initialX + dx}px`;
                container.style.top = `${initialY + dy}px`;
            });
            document.addEventListener('mouseup', () => isDragging = false);

            header.appendChild(closeBtn);
            container.appendChild(header);

            const contentBody = document.createElement('div');
            contentBody.id = 'lumina-stealth-content';
            contentBody.style.cssText = `
                padding: 16px;
                overflow-y: auto;
                font-size: 14px;
                line-height: 1.6;
                color: #e0e0e0;
                white-space: pre-wrap;
            `;
            container.appendChild(contentBody);

            document.body.appendChild(container);
        }

        const contentDiv = container.querySelector('#lumina-stealth-content');

        if (message.action === 'DISPLAY_SILENT_STATUS') {
            contentDiv.innerHTML = `<div style="color: #888; font-style: italic;">${message.status}</div>`;
        } else if (message.action === 'DISPLAY_SILENT_ANSWER') {
            // Apply lightweight markdown formatting for bold and code blocks
            let formatted = message.text
                .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #75ff8f;">$1</strong>')
                .replace(/`(.*?)`/g, '<code style="background: rgba(0,0,0,0.3); padding: 2px 4px; border-radius: 4px; font-family: monospace; color: #a5b4fc;">$1</code>');
            contentDiv.innerHTML = formatted;
        }
    }
});
