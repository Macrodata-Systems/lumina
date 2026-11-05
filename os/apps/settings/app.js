export class SettingsApp {
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
            <div style="padding: 20px; color: white; height: 100%; display: flex; flex-direction: column; gap: 15px;">
                <h2 style="margin: 0; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">Lumina Settings</h2>
                
                <div style="display: flex; gap: 20px;">
                    <div style="width: 150px; border-right: 1px solid rgba(255,255,255,0.1); padding-right: 10px;">
                        <ul style="list-style: none; padding: 0; margin: 0;">
                            <li style="padding: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; cursor: pointer;">General</li>
                            <li style="padding: 8px; cursor: pointer;">Appearance</li>
                            <li style="padding: 8px; cursor: pointer;">API Keys</li>
                            <li style="padding: 8px; cursor: pointer;">Storage</li>
                        </ul>
                    </div>
                    
                    <div style="flex-grow: 1;">
                        <h3>General</h3>
                        <div style="margin-bottom: 15px;">
                            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                <input type="checkbox" checked>
                                Start Lumina OS on browser launch
                            </label>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                <input type="checkbox" checked>
                                Enable Background Agent capabilities
                            </label>
                        </div>
                        
                        <p style="color: #888; font-size: 12px; margin-top: 40px;">OS Settings are currently read-only. API Keys and configuration are managed from the sidepanel.</p>
                    </div>
                </div>
            </div>
        `;

        this.window = this.kernel.wm.createWindow({
            title: 'Settings',
            width: 500,
            height: 400,
            content: content
        });
    }
}
