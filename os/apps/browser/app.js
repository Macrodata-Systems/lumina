export class BrowserApp {
    constructor(kernel) {
        this.kernel = kernel;
        this.window = null;
    }

    open() {
        if (this.window) {
            this.kernel.wm.focusWindow(this.window);
            return;
        }

        const content = `
            <div style="padding: 0; color: white; height: 100%; display: flex; flex-direction: column;">
                <div style="background: rgba(255,255,255,0.1); padding: 8px; display: flex; gap: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <button style="background:none;border:none;color:white;cursor:pointer;">⬅️</button>
                    <button style="background:none;border:none;color:white;cursor:pointer;">➡️</button>
                    <input type="text" id="browser-url-bar" value="about:blank" style="flex-grow: 1; padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: white;" readonly>
                    <button style="background:none;border:none;color:white;cursor:pointer;">🔄</button>
                </div>
                <div style="flex-grow: 1; position: relative;">
                    <iframe id="browser-view" style="width: 100%; height: 100%; border: none; background: #fff;" sandbox="allow-scripts"></iframe>
                </div>
            </div>
        `;

        this.window = this.kernel.wm.createWindow({
            title: 'Lumina Browser',
            width: 800,
            height: 600,
            maximized: true,
            content: content
        });

        this.window.addEventListener('window-closed', () => {
            this.window = null;
            const dockIcon = document.querySelector('.dock-item[data-app="browser"]');
            if (dockIcon) dockIcon.classList.remove('running');
        });

        // Add Enter key listener for URL bar
        const urlBar = this.window.querySelector('#browser-url-bar');
        urlBar.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const url = urlBar.value.trim();
                const agent = this.kernel.apps['agent']?.agent;
                if (agent && agent.targetTabId && url) {
                    let finalUrl = url;
                    if (!url.startsWith('http://') && !url.startsWith('https://')) {
                        finalUrl = 'https://' + url;
                    }
                    chrome.tabs.update(agent.targetTabId, { url: finalUrl });
                }
            }
        });
    }

    updateView(url, html) {
        if (!this.window) return;

        const urlBar = this.window.querySelector('#browser-url-bar');
        if (urlBar) urlBar.value = url;

        const iframe = this.window.querySelector('#browser-view');
        if (iframe && html) {
            // Basic parsing to inject base tag for relative assets
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, "text/html");
                const base = doc.createElement('base');
                base.href = url;
                doc.head.insertBefore(base, doc.head.firstChild);
                iframe.srcdoc = doc.documentElement.outerHTML;
            } catch (e) {
                iframe.srcdoc = html;
            }
        }
    }
}
