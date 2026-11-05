import { getAllDocuments } from '../../../modules/db.js';

export class FinderApp {
    constructor(kernel) {
        this.kernel = kernel;
        this.window = null;
        this.currentTab = 'rag'; // 'rag' or 'artifacts'
    }

    async open() {
        if (this.window) {
            this.kernel.wm.focusWindow(this.window);
            this.refresh();
            return;
        }

        const content = `
            <div style="display: flex; height: 100%; color: white; background: rgba(0,0,0,0.4);">
                <!-- Sidebar -->
                <div style="width: 150px; background: rgba(255,255,255,0.05); padding: 15px 10px; border-right: 1px solid rgba(255,255,255,0.1);">
                    <ul style="list-style: none; padding: 0; margin: 0; font-size: 14px;">
                        <li id="finder-tab-rag" style="padding: 6px 10px; background: rgba(255,255,255,0.2); border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                            <span>🧠</span> RAG Memory
                        </li>
                        <li id="finder-tab-artifacts" style="padding: 6px 10px; cursor: pointer; display: flex; align-items: center; gap: 8px; margin-top: 5px; opacity: 0.6;">
                            <span>📁</span> Artifacts
                        </li>
                    </ul>
                </div>
                <!-- Main Content -->
                <div style="flex-grow: 1; padding: 20px; overflow-y: auto;">
                    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-bottom: 15px;">
                        <h3 id="finder-header-title" style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Memory Files</h3>
                        <button id="finder-refresh" style="background: none; border: 1px solid rgba(255,255,255,0.2); color: white; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">Refresh</button>
                    </div>
                    <div id="finder-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 15px;">
                        <div style="grid-column: 1 / -1; text-align: center; color: #888; padding: 40px; font-size: 14px;">Loading memory...</div>
                    </div>
                </div>
            </div>
        `;

        this.window = this.kernel.wm.createWindow({
            title: 'Finder',
            width: 700,
            height: 450,
            content: content
        });

        this.window.addEventListener('window-closed', () => {
            this.window = null;
            const dockIcon = document.querySelector('.dock-item[data-app="finder"]');
            if (dockIcon) dockIcon.classList.remove('running');
        });

        this.setupListeners();
        this.refresh();
    }

    setupListeners() {
        const refreshBtn = this.window.querySelector('#finder-refresh');
        const tabRag = this.window.querySelector('#finder-tab-rag');
        const tabArtifacts = this.window.querySelector('#finder-tab-artifacts');

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                refreshBtn.style.opacity = '0.5';
                setTimeout(() => refreshBtn.style.opacity = '1', 200);
                this.refresh();
            });
        }

        const switchTab = (tab) => {
            this.currentTab = tab;
            if (tab === 'rag') {
                tabRag.style.background = 'rgba(255,255,255,0.2)';
                tabRag.style.opacity = '1';
                tabArtifacts.style.background = 'transparent';
                tabArtifacts.style.opacity = '0.6';
            } else {
                tabArtifacts.style.background = 'rgba(255,255,255,0.2)';
                tabArtifacts.style.opacity = '1';
                tabRag.style.background = 'transparent';
                tabRag.style.opacity = '0.6';
            }
            this.refresh();
        };

        if (tabRag && tabArtifacts) {
            tabRag.addEventListener('click', () => switchTab('rag'));
            tabArtifacts.addEventListener('click', () => switchTab('artifacts'));
        }
    }

    async refresh() {
        const grid = this.window.querySelector('#finder-grid');
        const title = this.window.querySelector('#finder-header-title');
        if (!grid) return;

        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #888; padding: 40px; font-size: 14px;">Loading...</div>';

        try {
            let files = [];

            if (this.currentTab === 'artifacts') {
                if (title) title.textContent = 'Artifacts';
                files = await this.kernel.fs.listFiles('/');

                if (files.length === 0) {
                    grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #888; padding: 40px; font-size: 14px;">No artifacts found. Use `/save filename` to save AI responses!</div>';
                    return;
                }
            } else {
                if (title) title.textContent = 'RAG Memory';
                const docs = await getAllDocuments();
                files = docs.map(d => ({
                    path: d.url || `memory_${d.id}.json`,
                    name: d.title || 'Untitled Document',
                    content: JSON.stringify(d, null, 2),
                    isMemory: true
                }));

                if (files.length === 0) {
                    grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #888; padding: 40px; font-size: 14px;">No files found in RAG memory. Upload a file via the Lumina chat panel.</div>';
                    return;
                }
            }

            grid.innerHTML = '';
            files.forEach(file => {
                // Determine icon
                let icon = '📄';
                const lowerPath = file.path.toLowerCase();
                if (lowerPath.endsWith('.md')) icon = '📝';
                if (lowerPath.endsWith('.pdf')) icon = '📋';
                if (lowerPath.endsWith('.png') || lowerPath.endsWith('.jpg') || lowerPath.endsWith('.jpeg')) icon = '🖼️';
                if (lowerPath.endsWith('.csv')) icon = '📊';

                if (file.isMemory) {
                    icon = '🧠';
                }

                // Format Name and Size
                const name = file.name || file.path.replace(/^\//, ''); // strip leading slash

                let sizeStr = '';
                if (file.isMemory) {
                    sizeStr = 'RAG Vector';
                } else if (typeof file.content === 'object' && Array.isArray(file.content.chunks)) {
                    sizeStr = `${file.content.chunks.length} chunks`;
                }

                const item = document.createElement('div');
                item.style.cssText = `
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    padding: 10px; border-radius: 8px; cursor: pointer; transition: background 0.1s;
                `;
                item.onmouseover = () => item.style.background = 'rgba(255,255,255,0.1)';
                item.onmouseout = () => item.style.background = 'transparent';
                item.title = `Path: ${file.path}`;

                item.innerHTML = `
                    <div style="font-size: 40px; margin-bottom: 5px; text-shadow: 0 4px 8px rgba(0,0,0,0.3);">${icon}</div>
                    <div style="font-size: 12px; text-align: center; word-break: break-all; max-height: 30px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${name}</div>
                    <div style="font-size: 10px; color: #aaa; margin-top: 4px;">${sizeStr}</div>
                `;

                // Add Double Click Open
                item.addEventListener('dblclick', () => {
                    if (this.kernel.apps['fileviewer']) {
                        this.kernel.apps['fileviewer'].open(file);
                    } else {
                        this.kernel.commandCenter.quickAlert(`Opening ${name}... Fileviewer coming soon!`);
                    }
                });

                grid.appendChild(item);
            });

        } catch (e) {
            console.error(e);
            grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: #ff5f56; padding: 40px; font-size: 14px;">Error reading FileSystem: ${e.message}</div>`;
        }
    }
}
