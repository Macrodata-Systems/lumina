console.log('Lumina: Content Script Loaded (v1.3.1 - Nuclear)');

// Create Bubble Element (Direct Injection, No Shadow DOM to avoid complexity)
const bubble = document.createElement('div');
bubble.id = 'lumina-bubble-overlay';
bubble.textContent = '✨ Explain with Lumina'; // CORRECTED TEXT
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
            console.log('Lumina: Selection detected:', text.substring(0, 20) + '...');
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

                console.log(`Lumina: Showing bubble at ${top}, ${left}`);
            } catch (err) {
                console.error('Lumina: Error calculating specific position', err);
            }
        } else {
            console.log('Lumina: Hiding bubble (no text)');
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
    console.log('Lumina: Bubble Clicked');
    e.preventDefault();
    e.stopPropagation();

    // Visual Feedback
    bubble.textContent = '⚡ Opening...';

    // Send Message
    chrome.runtime.sendMessage({
        action: 'explainText',
        text: lastSelection
    });

    // Reset after delay
    setTimeout(() => {
        bubble.style.display = 'none';
        bubble.textContent = '✨ Explain with Lumina';
    }, 1000);
});
