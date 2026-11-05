
import { AgentCore } from '../../agent/core.js';
import { formatMarkdown } from '../../../modules/utils.js';

/**
 * Lumina Agent App
 * UI for the Autonomous Agent.
 */
export class AgentApp {
    constructor(kernel) {
        this.kernel = kernel;
        this.window = null;
        this.agent = new AgentCore();
    }

    open() {
        if (this.window) {
            this.kernel.wm.focusWindow(this.window);
            return;
        }

        const content = `
            <div class="agent-app" style="height: 100%; display: flex; flex-direction: column; gap: 10px;">
                <div class="agent-input-area" style="display: flex; gap: 10px;">
                    <button id="agent-mic" style="padding: 6px 10px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" title="Voice Input">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                            <line x1="12" x2="12" y1="19" y2="22"></line>
                        </svg>
                    </button>
                    <input type="text" id="agent-goal" placeholder="What should I do? (e.g., 'Go to Wikipedia and search for AI')" style="flex-grow: 1; padding: 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: white;">
                    <button id="agent-start" style="padding: 8px 16px; background: #007bff; border: none; border-radius: 6px; color: white; cursor: pointer;">Start</button>
                    <button id="agent-stop" style="padding: 8px 16px; background: #dc3545; border: none; border-radius: 6px; color: white; cursor: pointer; display: none;">Stop</button>
                </div>
                <div class="agent-status" style="font-size: 12px; color: #888;">Idle</div>
                <div class="agent-logs" style="flex-grow: 1; background: rgba(0,0,0,0.3); border-radius: 6px; padding: 10px; overflow-y: auto; font-family: monospace; font-size: 12px; white-space: pre-wrap;"></div>
            </div>
        `;

        this.window = this.kernel.wm.createWindow({
            title: 'Lumina Agent (Auto-Pilot)',
            width: 500,
            height: 400,
            content: content
        });

        this.window.addEventListener('window-closed', () => {
            this.window = null;
            const dockIcon = document.querySelector('.dock-item[data-app="agent"]');
            if (dockIcon) dockIcon.classList.remove('running');
        });

        this.setupListeners();
        this.hookConsole();
    }

    setupListeners() {
        const startBtn = this.window.querySelector('#agent-start');
        const stopBtn = this.window.querySelector('#agent-stop');
        const micBtn = this.window.querySelector('#agent-mic');
        const input = this.window.querySelector('#agent-goal');
        const status = this.window.querySelector('.agent-status');

        // Setup Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;

            this.recognition.onstart = () => {
                this.isRecording = true;
                this.finalText = input.value ? input.value + ' ' : ''; // Preserve existing text
                micBtn.style.background = 'rgba(220, 53, 69, 0.4)'; // Red-ish
                micBtn.style.borderColor = 'rgba(220, 53, 69, 0.8)';
            };

            this.recognition.onresult = (event) => {
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        this.finalText += event.results[i][0].transcript + ' ';
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                input.value = (this.finalText + interimTranscript).trim();
            };

            this.recognition.onerror = (event) => {
                this.isRecording = false;
                if (event.error === 'no-speech') {
                    console.warn("Agent Speech recognition: No speech detected.");
                } else {
                    console.error("Agent Speech recognition error:", event.error);
                }
                this.stopRecording(micBtn);
            };

            this.recognition.onend = () => {
                // If it ends but we still want it running (e.g., continuous), 
                // we might need to restart it. But for agent, usually they speak one command.
                if (this.isRecording) {
                    try { this.recognition.start(); } catch (e) { }
                } else {
                    this.stopRecording(micBtn);
                }
            };

            micBtn.addEventListener('click', () => {
                if (this.isRecording) {
                    this.isRecording = false;
                    this.recognition.stop();
                    this.stopRecording(micBtn);
                } else {
                    input.value = ''; // Clear prior command usually? Or let them append. Let's append if needed.
                    try {
                        this.recognition.start();
                    } catch (e) {
                        console.error("Could not start recognition", e);
                    }
                }
            });
        } else {
            micBtn.style.display = 'none'; // Not supported
            console.warn("Speech recognition not supported in this browser.");
        }

        startBtn.addEventListener('click', () => {
            const goal = input.value;
            if (!goal) return;

            startBtn.style.display = 'none';
            stopBtn.style.display = 'block';
            status.textContent = 'Running...';
            status.style.color = '#28a745';

            this.agent.run(goal).then(() => {
                this.resetUI();
            });
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                startBtn.click();
            }
        });

        stopBtn.addEventListener('click', () => {
            this.agent.isRunning = false;
            this.resetUI();
        });
    }

    resetUI() {
        if (!this.window) return;

        const startBtn = this.window.querySelector('#agent-start');
        const stopBtn = this.window.querySelector('#agent-stop');
        const status = this.window.querySelector('.agent-status');

        if (startBtn) startBtn.style.display = 'block';
        if (stopBtn) stopBtn.style.display = 'none';
        if (status) {
            status.textContent = 'Idle';
            status.style.color = '#888';
        }
    }

    stopRecording(btn) {
        this.isRecording = false;
        if (btn) {
            btn.style.background = 'rgba(255,255,255,0.1)';
            btn.style.borderColor = 'rgba(255,255,255,0.2)';
        }
    }

    hookConsole() {
        const logContainer = this.window.querySelector('.agent-logs');

        this.agent.onLog = (msg, type) => {
            const div = document.createElement('div');

            if (type === 'success') {
                div.innerHTML = formatMarkdown(msg);
                div.style.marginBottom = '12px';
                div.style.marginTop = '12px';
                div.style.padding = '12px';
                div.style.borderRadius = '8px';
                div.style.background = 'rgba(40, 167, 69, 0.15)';
                div.style.color = '#e6ffea';
                div.style.border = '1px solid rgba(40, 167, 69, 0.4)';
                div.style.fontFamily = 'system-ui, -apple-system, sans-serif';
                div.style.fontSize = '14px';
                div.style.lineHeight = '1.6';

                // Style markdown elements inside the container
                div.querySelectorAll('strong, b').forEach(el => el.style.color = '#75ff8f');
                div.querySelectorAll('h1, h2, h3').forEach(el => {
                    el.style.margin = '0 0 8px 0';
                    el.style.color = '#fff';
                    el.style.fontSize = '1.1em';
                });
                div.querySelectorAll('a').forEach(el => {
                    el.style.color = '#75ff8f';
                    el.style.textDecoration = 'none';
                    el.style.borderBottom = '1px dotted rgba(117, 255, 143, 0.5)';
                });
                div.querySelectorAll('ul, ol').forEach(el => {
                    el.style.marginTop = '6px';
                    el.style.marginBottom = '6px';
                    el.style.paddingLeft = '20px';
                });
                div.querySelectorAll('li').forEach(el => {
                    el.style.marginBottom = '2px';
                });
                div.querySelectorAll('code').forEach(el => {
                    el.style.background = 'rgba(0,0,0,0.3)';
                    el.style.padding = '2px 4px';
                    el.style.borderRadius = '4px';
                    el.style.fontFamily = 'monospace';
                });
            } else {
                div.textContent = `> ${msg}`;
                div.style.marginBottom = '6px';
                div.style.padding = '4px';
                div.style.borderRadius = '4px';

                if (type === 'error') {
                    div.style.color = '#ff6b6b';
                } else {
                    div.style.color = '#e0e0e0';
                }
            }

            logContainer.appendChild(div);
            logContainer.scrollTop = logContainer.scrollHeight;
        };
    }
}
