
/**
 * Lumina Command Center
 * Spotlight-like interface for executing commands and searching.
 */
export class CommandCenter {
    constructor(kernel) {
        this.kernel = kernel;
        this.isVisible = false;
        this.element = null;
        this.input = null;
        this.results = null;
    }
    init() {
        this.createUI();
        this.setupListeners();
    }

    quickAlert(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: absolute; top: 20px; right: 20px; 
            background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2); color: white;
            padding: 12px 20px; border-radius: 8px; z-index: 100000;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5); font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 14px; display: flex; align-items: center; gap: 10px;
            transition: opacity 0.3s ease-out, transform 0.3s ease-out;
            transform: translateY(-20px); opacity: 0;
        `;
        toast.innerHTML = `<span>✨</span> <div>${message}</div>`;
        document.body.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    createUI() {
        const overlay = document.createElement('div');
        overlay.id = 'command-center-overlay';
        overlay.style.display = 'none';

        overlay.innerHTML = `
            <div class="command-center">
                <div class="command-input-wrapper">
                    <span class="command-icon">🔍</span>
                    <input type="text" id="command-input" placeholder="Type a command or ask AI..." autocomplete="off">
                </div>
                <div class="command-results" id="command-results">
                    <!-- Results populated here -->
                    <div class="command-hint">Press Enter to execute</div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        this.element = overlay;
        this.input = overlay.querySelector('#command-input');
        this.results = overlay.querySelector('#command-results');
    }

    setupListeners() {
        // Toggle with Cmd+K or Ctrl+K
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                this.toggle();
            }

            if (this.isVisible && e.key === 'Escape') {
                this.hide();
            }
        });

        // Input handling
        this.input.addEventListener('input', (e) => {
            this.handleInput(e.target.value);
        });

        // Click outside to close
        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) {
                this.hide();
            }
        });
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    show() {
        this.isVisible = true;
        this.element.style.display = 'flex';
        this.input.focus();
        this.input.value = '';
        this.renderSuggestions();
    }

    hide() {
        this.isVisible = false;
        this.element.style.display = 'none';
    }

    handleInput(query) {
        if (!query) {
            this.renderSuggestions();
            return;
        }

        // TODO: Implement actual search/command logic
        // For now, just echo
        this.results.innerHTML = `
            <div class="result-category">AI Actions</div>
            <div class="result-item">
                <span class="result-icon">✨</span>
                <span class="result-text">Ask AI: "${query}"</span>
            </div>
             <div class="result-category">System</div>
            <div class="result-item">
                <span class="result-icon">🖥️</span>
                <span class="result-text">Run process: "${query}"</span>
            </div>
        `;
    }

    renderSuggestions() {
        this.results.innerHTML = `
            <div class="result-category">Suggestions</div>
            <div class="result-item">
                <span class="result-icon">📝</span>
                <span class="result-text">New Note</span>
            </div>
            <div class="result-item">
                <span class="result-icon">⚙️</span>
                <span class="result-text">Settings</span>
            </div>
        `;
    }
}
