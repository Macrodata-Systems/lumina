export class TerminalApp {
    constructor(kernel) {
        this.kernel = kernel;
        this.window = null;
        this.history = [];
        this.cwd = '/';
        this.user = 'user';
    }

    open() {
        if (this.window) {
            this.kernel.wm.focusWindow(this.window);
            return;
        }

        const content = `
            <div id="term-container" style="padding: 10px; color: #0f0; height: 100%; font-family: 'JetBrains Mono', Consolas, monospace; background: #000; box-sizing: border-box; overflow-y: auto; font-size: 13px;">
                <div id="term-output">
                    <div>Last login: ${new Date().toLocaleString()} on ttys001</div>
                    <div>Welcome to Lumina Terminal</div>
                    <div style="color: #888; margin-bottom: 10px;">Type 'help' for available commands.</div>
                </div>
                <div style="display: flex; align-items: center;">
                    <span style="color: #0f0; margin-right: 8px;">Lumina-OS:~ ${this.user}$</span>
                    <input type="text" id="term-input" style="flex-grow: 1; background: transparent; border: none; color: #0f0; outline: none; font-family: inherit; font-size: inherit;" autocomplete="off" spellcheck="false">
                </div>
            </div>
        `;

        this.window = this.kernel.wm.createWindow({
            title: 'Terminal - bash - 80x24',
            width: 600,
            height: 400,
            content: content
        });

        this.window.addEventListener('window-closed', () => {
            this.window = null;
            const dockIcon = document.querySelector('.dock-item[data-app="terminal"]');
            if (dockIcon) dockIcon.classList.remove('running');
        });

        this.setupListeners();
    }

    setupListeners() {
        const input = this.window.querySelector('#term-input');
        const container = this.window.querySelector('#term-container');

        // Focus input when clicking anywhere in terminal
        container.addEventListener('click', () => input.focus());

        // Initial focus
        setTimeout(() => input.focus(), 100);

        input.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                const cmd = input.value.trim();
                input.value = '';
                await this.executeCommand(cmd);
            }
        });
    }

    print(text, isHtml = false) {
        const output = this.window.querySelector('#term-output');
        const div = document.createElement('div');
        if (isHtml) {
            div.innerHTML = text;
        } else {
            div.textContent = text;
        }
        output.appendChild(div);

        const container = this.window.querySelector('#term-container');
        container.scrollTop = container.scrollHeight;
    }

    async executeCommand(cmdStr) {
        // Echo the command
        this.print(`Lumina-OS:~ ${this.user}$ ${cmdStr}`);

        if (!cmdStr) return;

        const args = cmdStr.split(' ');
        const cmd = args[0].toLowerCase();

        try {
            switch (cmd) {
                case 'help':
                    this.print('Available commands: help, clear, echo, date, whoami, ls, pwd');
                    break;
                case 'clear':
                    this.window.querySelector('#term-output').innerHTML = '';
                    break;
                case 'echo':
                    this.print(args.slice(1).join(' '));
                    break;
                case 'date':
                    this.print(new Date().toString());
                    break;
                case 'whoami':
                    this.print(this.user);
                    break;
                case 'pwd':
                    this.print(this.cwd);
                    break;
                case 'ls':
                    const files = await this.kernel.fs.listFiles(this.cwd);
                    if (files.length === 0) {
                        this.print(' (empty)');
                    } else {
                        const fileNames = files.map(f => f.path.substring(1)).join('  ');
                        this.print(`<span style="color: #aaa;">${fileNames}</span>`, true);
                    }
                    break;
                default:
                    this.print(`bash: ${cmd}: command not found`);
            }
        } catch (e) {
            this.print(`Error: ${e.message}`, true);
        }
    }
}
