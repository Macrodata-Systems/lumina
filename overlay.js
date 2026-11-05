import { formatMarkdown } from './modules/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const content = document.getElementById('overlay-content');

    if (window.mermaid) {
        window.mermaid.initialize({ startOnLoad: false, theme: 'dark' });
    }

    // Check initial state
    chrome.storage.local.get(['overlay_status', 'overlay_answer'], (data) => {
        if (data.overlay_answer) {
            renderAnswer(data.overlay_answer);
        } else if (data.overlay_status) {
            content.innerHTML = `<div style="color: #888; font-style: italic;">${data.overlay_status}</div>`;
        }
    });

    // Listen for storage changes from background.js
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
            if (changes.overlay_answer && changes.overlay_answer.newValue) {
                renderAnswer(changes.overlay_answer.newValue);
            } else if (changes.overlay_status && changes.overlay_status.newValue) {
                const statusHtml = `<div id="temp-status" style="color: #888; font-style: italic; margin-top: 20px; border-top: 1px solid #333; padding-top: 10px;">${changes.overlay_status.newValue}</div>`;
                const existingStatus = document.getElementById('temp-status');
                if (existingStatus) {
                    existingStatus.innerHTML = changes.overlay_status.newValue;
                } else if (content.innerHTML.length > 50 && !content.innerHTML.includes('📸 Capturing screenshot') && !content.innerHTML.includes('🧠 Analyzing')) {
                    // Append gracefully at bottom to preserve existing chat/answer history
                    content.innerHTML += statusHtml;
                    window.scrollTo(0, document.body.scrollHeight);
                } else {
                    // Default overwrite for initial loading phases
                    content.innerHTML = `<div style="color: #888; font-style: italic;">${changes.overlay_status.newValue}</div>`;
                }
            }
        }
    });

    function renderAnswer(text) {
        // Apply lightweight markdown formatting for bold and code blocks, and parse Mermaid
        let formatted = formatMarkdown(text) || text
            .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #75ff8f;">$1</strong>')
            .replace(/```mermaid\n([\s\S]*?)```/g, '<div class="mermaid">$1</div>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
        content.innerHTML = formatted;

        // Render any newly inserted mermaid diagrams
        setTimeout(() => {
            if (window.mermaid) {
                try {
                    mermaid.run({ querySelector: '.mermaid' });
                } catch (e) {
                    console.error("Mermaid parsing error:", e);
                }
            }
        }, 100);

        // Add copy buttons to code blocks
        content.querySelectorAll('pre').forEach(pre => {
            if (pre.parentNode.classList.contains('code-wrapper')) return;

            const wrapper = document.createElement('div');
            wrapper.className = 'code-wrapper';

            const btn = document.createElement('button');
            btn.className = 'copy-btn';
            btn.innerText = '📋 Copy';

            btn.onclick = () => {
                const code = pre.querySelector('code');
                const textToCopy = code ? code.innerText : pre.innerText;
                navigator.clipboard.writeText(textToCopy).then(() => {
                    btn.innerText = '✅ Copied!';
                    setTimeout(() => { btn.innerText = '📋 Copy'; }, 2000);
                }).catch(err => console.error('Copy failed', err));
            };

            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(pre);
            wrapper.appendChild(btn);
        });

        // Store raw text for full copy (as fallback)
        content.dataset.rawText = text;

        // Remove the stored answer so it doesn't persist to the next run
        chrome.storage.local.remove('overlay_answer');
    }

    // Full answer copy logic
    const copyAllBtn = document.getElementById('copy-all-btn');
    if (copyAllBtn) {
        copyAllBtn.addEventListener('click', async () => {
            try {
                // Temporarily hide copy buttons so they aren't included in the copied text/HTML
                const copyBtns = content.querySelectorAll('.copy-btn');
                copyBtns.forEach(btn => btn.style.display = 'none');

                // Get clean innerText for .txt files
                const plainText = content.innerText;
                const textBlob = new Blob([plainText], { type: 'text/plain' });

                // Get innerHTML for Google Docs/Word (rich text)
                const htmlBlob = new Blob([content.innerHTML], { type: 'text/html' });

                // Restore buttons
                copyBtns.forEach(btn => btn.style.display = '');

                // Write both formats to clipboard using the Clipboard API
                const clipboardItem = new ClipboardItem({
                    'text/plain': textBlob,
                    'text/html': htmlBlob
                });

                await navigator.clipboard.write([clipboardItem]);

                copyAllBtn.innerText = '✅';
                setTimeout(() => { copyAllBtn.innerText = '📋'; }, 2000);
            } catch (err) {
                console.warn('Rich copy failed, falling back to text clone', err);
                const textFallback = content.innerText || content.dataset.rawText;
                navigator.clipboard.writeText(textFallback).then(() => {
                    copyAllBtn.innerText = '✅';
                    setTimeout(() => { copyAllBtn.innerText = '📋'; }, 2000);
                });
            }
        });
    }

    // --- Microphone Follow-up Logic ---
    const micBtn = document.getElementById('mic-btn');
    const micStatus = document.getElementById('mic-status');
    const micTextSpan = micStatus.querySelector('span');
    let recognition = null;
    let isListening = false;
    let finalTranscript = '';

    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = function () {
            isListening = true;
            micBtn.classList.add('active');
            micStatus.style.display = 'block';
            finalTranscript = '';
            micTextSpan.innerText = '';
        };

        recognition.onresult = function (event) {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript + ' ';
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            micTextSpan.innerText = finalTranscript + interimTranscript;
        };

        recognition.onerror = function (event) {
            console.error("Speech recognition error", event.error);
            stopListening();
        };

        recognition.onend = function () {
            isListening = false;
            stopListening();

            if (finalTranscript.trim().length > 0) {
                // Send the transcript to the background script to process the followup
                chrome.storage.local.set({ overlay_status: `<b>🎙️ Asking:</b> "${finalTranscript.trim()}"<br><small style="color: #75ff8f;">Generating updated answer...</small>`, overlay_answer: null });
                chrome.runtime.sendMessage({ action: 'overlay_followup', text: finalTranscript.trim() });
            }
        };
    } else {
        micBtn.style.display = 'none'; // Hide if not supported
    }

    function stopListening() {
        if (recognition) {
            recognition.stop();
        }
        micBtn.classList.remove('active');
        micStatus.style.display = 'none';
        isListening = false;
    }

    micBtn.addEventListener('click', () => {
        if (!recognition) return;

        if (isListening) {
            stopListening();
        } else {
            try {
                recognition.start();
            } catch (e) {
                console.error("Could not start recognition", e);
            }
        }
    });
});
