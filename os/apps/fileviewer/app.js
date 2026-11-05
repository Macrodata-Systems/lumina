export class FileViewerApp {
    constructor(kernel) {
        this.kernel = kernel;
        this.window = null;
    }

    open(file) {
        if (!file) return;

        if (this.window) {
            this.kernel.wm.focusWindow(this.window);
            this.loadFile(file);
            return;
        }

        const content = `
            <div style="display: flex; flex-direction: column; height: 100%; background: #1e1e1e; color: #d4d4d4; font-family: 'JetBrains Mono', Consolas, monospace;">
                <!-- Header / Toolbar -->
                <div style="padding: 10px 15px; background: #252526; border-bottom: 1px solid #333; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span id="fv-icon" style="font-size: 16px;">📄</span>
                        <span id="fv-filename" style="font-size: 13px; font-weight: 500; color: #fff;">${file.name || 'Untitled'}</span>
                    </div>
                </div>
                
                <!-- Content Area -->
                <div id="fv-content-area" style="flex-grow: 1; padding: 20px; overflow-y: auto; font-size: 13px; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word;">
                    Loading...
                </div>
            </div>
        `;

        this.window = this.kernel.wm.createWindow({
            title: 'File Viewer',
            width: 750,
            height: 500,
            content: content
        });

        this.window.addEventListener('window-closed', () => {
            this.window = null;
        });

        this.loadFile(file);
    }

    loadFile(file) {
        const titleEl = this.window.querySelector('.window-title');
        const fileNameEl = this.window.querySelector('#fv-filename');
        const iconEl = this.window.querySelector('#fv-icon');
        const contentArea = this.window.querySelector('#fv-content-area');

        const fileName = (file.path || file.name || '').split('/').pop() || 'Untitled';

        if (titleEl) titleEl.textContent = `File Viewer - ${fileName}`;
        if (fileNameEl) fileNameEl.textContent = fileName;

        // Determine icon and formatting
        let icon = '📄';
        const lowerName = fileName.toLowerCase();
        if (lowerName.endsWith('.md')) icon = '📝';
        else if (lowerName.endsWith('.txt')) icon = '📃';
        else if (lowerName.endsWith('.json')) icon = '{"}';
        else if (lowerName.endsWith('.js')) icon = '⚡';

        if (iconEl) iconEl.textContent = icon;

        let displayContent = '';
        if (typeof file.content === 'string') {
            displayContent = this.escapeHtml(file.content);
        } else if (typeof file.content === 'object') {
            displayContent = this.escapeHtml(JSON.stringify(file.content, null, 2));
        } else {
            displayContent = 'Unsupported file format.';
        }

        if (lowerName.endsWith('.md')) {
            // Optional basic markdown rendering could go here
            // For now, raw markdown looks fine in pre-wrap
        }

        if (contentArea) {
            contentArea.innerHTML = displayContent;
        }
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}
