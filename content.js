/**
 * Lumina - AI Copilot for the Web
 * Copyright (c) 2026 Harsh Raj Singh. All Rights Reserved.
 * Proprietary and Confidential.
 */

// Lumina: Content Script Loaded (v1.3.1)

// Create Bubble Element (Direct Injection, No Shadow DOM to avoid complexity)
const bubble = document.createElement('div');
bubble.id = 'lumina-bubble-overlay';
bubble.textContent = '💎 Explain with Lumina'; // CORRECTED TEXT
// Use inline styles with !important to force visibility
bubble.style.cssText = `
    position: absolute !important;
    z-index: 2147483647 !important;
    background: linear-gradient(135deg, #1a1a1a, #2d2d2d) !important;
    color: white !important;
    padding: 8px 16px !important;
    border-radius: 50px !important;
    font-family: sans-serif !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3) !important;
    display: none; /* Toggled via JS */
    align-items: center !important;
    gap: 8px !important;
    pointer-events: auto !important;
    transition: transform 0.1s ease !important;
    white-space: nowrap !important;
    line-height: normal !important;
    border: 1px solid rgba(255,255,255,0.2) !important;
`;

// Append to HTML to ensure it's not trapped in a relative body
document.documentElement.appendChild(bubble);

let lastSelection = '';

document.addEventListener('mouseup', (e) => {
    // 1. Debounce slightly
    setTimeout(() => {
        const selection = window.getSelection();
        const text = selection.toString().trim();

        if (text.length > 0) {
            lastSelection = text;

            // 2. Get Coordinates
            try {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();

                // 3. Calculate Absolute Position (accounting for scroll)
                // We use document.documentElement.scrollLeft/Top for robustness
                const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
                const scrollY = window.pageYOffset || document.documentElement.scrollTop;

                let top = rect.top + scrollY - 50;
                let left = rect.left + scrollX + (rect.width / 2) - (bubble.offsetWidth / 2);

                // Safety checks
                if (top < scrollY) top = rect.bottom + scrollY + 10;
                if (left < 0) left = 10;

                // 4. Show Bubble
                bubble.style.top = `${top}px`;
                bubble.style.left = `${left}px`;
                bubble.style.display = 'flex';
            } catch (err) {
                console.error('Lumina: Error calculating specific position', err);
            }
        } else {
            bubble.style.display = 'none';
        }
    }, 50);
});

// Hide on background click
document.addEventListener('mousedown', (e) => {
    if (e.target !== bubble && !bubble.contains(e.target)) {
        bubble.style.display = 'none';
    }
});

// Handle Click
bubble.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Visual Feedback
    bubble.textContent = '⚡ Opening...';

    // Send Message (with safety check)
    if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
        try {
            chrome.runtime.sendMessage({
                action: 'explainText',
                text: lastSelection
            });
        } catch (error) {
            console.error('Lumina: Extension context invalidated. Please reload the page.', error);

            // 1. Visual Feedback on Button
            bubble.textContent = '⚠️ Reload page';
            bubble.style.backgroundColor = '#ef4444';
            bubble.style.color = 'white';

            // 2. Explicit Alert to ensure user sees it
            alert('Lumina Extension Updated: Please reload this page for changes to take effect.');

            setTimeout(() => {
                bubble.textContent = '💎 Explain with Lumina';
                bubble.style.backgroundColor = '';
                bubble.style.color = '';
            }, 5000);
        }
    } else {
        console.error('Lumina: Extension context invalidated. Please reload the page.');
        bubble.textContent = '⚠️ Reload page';
        setTimeout(() => {
            bubble.textContent = '💎 Explain with Lumina';
        }, 2000);
    }

    // Reset after delay
    setTimeout(() => {
        bubble.style.display = 'none';
        bubble.textContent = '💎 Explain with Lumina'; // CORRECTED TEXT
    }, 1000);
});
