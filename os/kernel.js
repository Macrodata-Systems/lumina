
import { FileSystem } from './filesystem.js';
import { WindowManager } from './window_manager.js';
import { CommandCenter } from './command_center.js';
import { AgentApp } from './apps/agent/app.js';
import { FinderApp } from './apps/finder/app.js';
import { BrowserApp } from './apps/browser/app.js';
import { TerminalApp } from './apps/terminal/app.js';
import { SettingsApp } from './apps/settings/app.js';
import { FileViewerApp } from './apps/fileviewer/app.js';

/**
 * Lumina Kernel
 * The heart of the OS.
 */
class Kernel {
    constructor() {
        this.fs = new FileSystem();
        this.wm = null; // Initialized after DOM load
        this.commandCenter = new CommandCenter(this);
        window.luminaKernel = this; // Expose globally for API / command integration
    }

    async boot() {
        console.log('Lumina OS Booting...');

        // Initialize File System
        await this.fs.init();
        console.log('FileSystem Mounted');

        // Initialize Window Manager
        const desktop = document.getElementById('desktop');
        if (desktop) {
            this.wm = new WindowManager(desktop);
            console.log('WindowManager Initialized');
        } else {
            console.error('Desktop environment not found');
        }

        // Initialize Command Center
        this.commandCenter.init();

        // Initialize Apps
        this.apps = {
            'agent': new AgentApp(this),
            'finder': new FinderApp(this),
            'browser': new BrowserApp(this),
            'terminal': new TerminalApp(this),
            'settings': new SettingsApp(this),
            'fileviewer': new FileViewerApp(this)
        };

        // Load Startup Apps
        this.loadDesktop();
        this.setupDock();
    }

    setupDock() {
        document.querySelectorAll('.dock-item').forEach(item => {
            item.addEventListener('click', () => {
                const appName = item.dataset.app;
                if (this.apps[appName]) {
                    // Visual indicator for active app
                    document.querySelectorAll('.dock-item').forEach(i => i.classList.remove('running'));
                    item.classList.add('running');

                    this.apps[appName].open();
                } else {
                    console.log('App not implemented:', appName);
                }
            });
        });
    }

    loadDesktop() {
        if (this.wm) {
            const welcomeContent = `
                <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%); text-align: center; padding: 30px;">
                    <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #8b5cf6, #3b82f6); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; box-shadow: 0 10px 30px rgba(139, 92, 246, 0.4), inset 0 2px 5px rgba(255,255,255,0.4);">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13"/><path d="M12 3v19"/><path d="M13 3l3 6-4 13"/><path d="M2 9h20"/></svg>
                    </div>
                    <h1 style="margin: 0; font-size: 32px; font-weight: 700; background: linear-gradient(to right, #fff, #a5b4fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -0.5px;">Lumina OS</h1>
                    <p style="color: rgba(255,255,255,0.6); font-size: 15px; margin-top: 10px; max-width: 80%; line-height: 1.5;">The intelligent browser operating system. Agent ready, memory loaded, tools connected.</p>
                    
                    <div style="margin-top: 30px; display: flex; gap: 10px;">
                        <button id="welcome-view-apps" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 8px 16px; border-radius: 8px; cursor: pointer; transition: background 0.2s;">View Apps</button>
                        <button id="welcome-start-agent" style="background: #3b82f6; border: none; color: white; padding: 8px 16px; border-radius: 8px; cursor: pointer; transition: background 0.2s; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);">Start Agent</button>
                    </div>
                </div>
            `;

            const winWidth = 450;
            const winHeight = 350;
            const xPos = (window.innerWidth / 2) - (winWidth / 2);
            const yPos = (window.innerHeight / 2) - (winHeight / 2) - 50; // slightly above center

            const welcomeWin = this.wm.createWindow({
                title: 'Welcome to Lumina',
                content: welcomeContent,
                width: winWidth,
                height: winHeight,
                x: xPos,
                y: yPos,
                maximized: true
            });

            // Button actions
            const viewAppsBtn = welcomeWin.querySelector('#welcome-view-apps');
            if (viewAppsBtn) {
                viewAppsBtn.onmouseover = () => viewAppsBtn.style.background = 'rgba(255,255,255,0.2)';
                viewAppsBtn.onmouseout = () => viewAppsBtn.style.background = 'rgba(255,255,255,0.1)';
                viewAppsBtn.onclick = () => {
                    const dock = document.getElementById('dock');
                    if (dock) {
                        dock.style.boxShadow = '0 0 40px rgba(255, 255, 255, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.5)';
                        setTimeout(() => dock.style.boxShadow = '', 1500);
                    }
                    this.wm.closeWindow(welcomeWin);
                };
            }

            const startAgentBtn = welcomeWin.querySelector('#welcome-start-agent');
            if (startAgentBtn) {
                startAgentBtn.onmouseover = () => startAgentBtn.style.background = '#2563eb';
                startAgentBtn.onmouseout = () => startAgentBtn.style.background = '#3b82f6';
                startAgentBtn.onclick = () => {
                    if (this.apps['agent']) {
                        document.querySelectorAll('.dock-item').forEach(i => i.classList.remove('running'));
                        const agentDockIcon = document.querySelector('.dock-item[data-app="agent"]');
                        if (agentDockIcon) agentDockIcon.classList.add('running');
                        this.apps['agent'].open();
                    }
                    this.wm.closeWindow(welcomeWin);
                };
            }
        }
    }
}

// Global OS Instance
window.OS = new Kernel();
window.addEventListener('load', () => {
    window.OS.boot();
});
