
/**
 * Lumina Window Manager
 * Handles creating, moving, resizing, and managing windows.
 */
export class WindowManager {
    constructor(rootElement) {
        this.root = rootElement;
        this.windows = [];
        this.activeWindow = null;
        this.zIndexCounter = 100;
    }

    createWindow(options = {}) {
        const {
            title = 'Untitled',
            width = 400,
            height = 300,
            x = 50,
            y = 50,
            content = '',
            id = `win-${Date.now()}`,
            maximized = false
        } = options;

        const winEl = document.createElement('div');
        winEl.classList.add('os-window');
        winEl.id = id;
        winEl.style.width = `${width}px`;
        winEl.style.height = `${height}px`;
        winEl.style.transform = `translate(${x}px, ${y}px)`;
        winEl.style.zIndex = ++this.zIndexCounter;

        winEl.innerHTML = `
      <div class="window-header">
        <div class="window-controls">
          <button class="close-btn"></button>
          <button class="minimize-btn"></button>
          <button class="maximize-btn"></button>
        </div>
        <div class="window-title">${title}</div>
      </div>
      <div class="window-content">
        ${content}
      </div>
      <div class="resize-handle"></div>
    `;

        this.root.appendChild(winEl);
        this.windows.push(winEl);
        this.activeWindow = winEl;

        this.setupInteractions(winEl);

        if (maximized) {
            const maxBtn = winEl.querySelector('.maximize-btn');
            if (maxBtn) maxBtn.click();
        }

        return winEl;
    }

    setupInteractions(winEl) {
        const header = winEl.querySelector('.window-header');
        const closeBtn = winEl.querySelector('.close-btn');
        const maxBtn = winEl.querySelector('.maximize-btn');
        const minBtn = winEl.querySelector('.minimize-btn');
        const resizeHandle = winEl.querySelector('.resize-handle');

        // Dragging
        let isDragging = false;
        let startX, startY, initialX, initialY;

        header.addEventListener('mousedown', (e) => {
            if (e.target.tagName.toLowerCase() === 'button') return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;

            const style = window.getComputedStyle(winEl);
            const matrix = new WebKitCSSMatrix(style.transform);
            initialX = matrix.m41;
            initialY = matrix.m42;

            this.focusWindow(winEl);
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            // Boundary checks to keep window header accessible
            let newY = initialY + dy;
            if (newY < 0) newY = 0; // Don't drag above screen

            winEl.style.transform = `translate(${initialX + dx}px, ${newY}px)`;
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Resizing
        let isResizing = false;
        let startWidth, startHeight, startResizeX, startResizeY;

        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startResizeX = e.clientX;
            startResizeY = e.clientY;
            startWidth = parseInt(window.getComputedStyle(winEl).width, 10);
            startHeight = parseInt(window.getComputedStyle(winEl).height, 10);
            this.focusWindow(winEl);
            e.stopPropagation();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const dx = e.clientX - startResizeX;
            const dy = e.clientY - startResizeY;

            let newWidth = Math.max(200, startWidth + dx); // Minimum width
            let newHeight = Math.max(150, startHeight + dy); // Minimum height

            winEl.style.width = `${newWidth}px`;
            winEl.style.height = `${newHeight}px`;
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
        });

        // Close
        closeBtn.addEventListener('click', () => {
            this.closeWindow(winEl);
        });

        // Maximize
        let isMaximized = false;
        let preMaxState = {};

        maxBtn.addEventListener('click', () => {
            if (!isMaximized) {
                const style = window.getComputedStyle(winEl);
                preMaxState = {
                    width: style.width,
                    height: style.height,
                    transform: style.transform
                };
                winEl.style.width = '100vw';
                winEl.style.height = 'calc(100vh - 60px)'; // Account for Dock
                winEl.style.transform = `translate(0px, 0px)`;
                winEl.style.borderRadius = '0px';
                isMaximized = true;
            } else {
                winEl.style.width = preMaxState.width;
                winEl.style.height = preMaxState.height;
                winEl.style.transform = preMaxState.transform;
                winEl.style.borderRadius = '12px';
                isMaximized = false;
            }
        });

        // Minimize (just hide for now to mimic macOS dock drop)
        minBtn.addEventListener('click', () => {
            winEl.style.display = 'none';
            if (this.activeWindow === winEl) {
                const activeOthers = this.windows.filter(w => w !== winEl && w.style.display !== 'none');
                this.activeWindow = activeOthers.length > 0 ? activeOthers[activeOthers.length - 1] : null;
                if (this.activeWindow) this.focusWindow(this.activeWindow);
            }
        });

        // Focus on click
        winEl.addEventListener('mousedown', () => {
            this.focusWindow(winEl);
        });
    }

    focusWindow(winEl) {
        if (this.activeWindow === winEl && winEl.style.display !== 'none') return;

        // Ensure the window is unhidden if it was minimized
        winEl.style.display = 'flex';

        winEl.style.zIndex = ++this.zIndexCounter;
        this.activeWindow = winEl;

        // Update visual active state if needed (e.g. shadow)
        this.windows.forEach(w => w.classList.remove('active'));
        winEl.classList.add('active');
    }

    closeWindow(winEl) {
        winEl.dispatchEvent(new Event('window-closed'));
        winEl.remove();
        this.windows = this.windows.filter(w => w !== winEl);
        if (this.activeWindow === winEl) {
            this.activeWindow = this.windows.length > 0 ? this.windows[this.windows.length - 1] : null;
            if (this.activeWindow) this.focusWindow(this.activeWindow);
        }
    }
}
