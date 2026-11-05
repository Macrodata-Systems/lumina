
import { ActionExecutor } from './executor.js';

/**
 * Lumina Agent Core
 * The "Brain" of the autonomous agent.
 */
export class AgentCore {
    constructor() {
        this.executor = new ActionExecutor();
        this.isRunning = false;
        this.history = [];
        this.onLog = null;
    }

    log(msg, type = 'info') {
        if (this.onLog) {
            this.onLog(msg, type);
        } else {
            console.log(msg);
        }
    }

    async run(goal) {
        if (this.isRunning) return;
        this.isRunning = true;
        this.history = [];
        this.log(`Agent started with goal: ${goal}`, 'info');

        // Create a playground tab in a minimized window
        const newWindow = await chrome.windows.create({
            url: 'https://www.google.com',
            state: 'minimized'
        });

        this.targetTabId = newWindow.tabs[0].id;
        this.targetWindowId = newWindow.id;

        // Wait for tab to load
        await new Promise(r => setTimeout(r, 1000));

        try {
            await this.loop(goal);
        } catch (error) {
            console.error('Agent error:', error);
        } finally {
            this.isRunning = false;

            // Clean up the background window
            if (this.targetWindowId) {
                try {
                    await chrome.windows.remove(this.targetWindowId);
                } catch (e) {
                    console.error("Failed to close agent window", e);
                }
                this.targetWindowId = null;
                this.targetTabId = null;
            }
        }
    }

    async loop(goal) {
        let step = 0;
        const maxSteps = 15;

        while (step < maxSteps && this.isRunning) {
            this.log(`Step ${step + 1}...`, 'info');

            // 1. Observe
            const domSnapshot = await this.executor.read(this.targetTabId); // Get simplified DOM

            try {
                const html = await this.executor.getOuterHTML(this.targetTabId);
                const tabInfo = await chrome.tabs.get(this.targetTabId);

                if (window.luminaKernel && window.luminaKernel.apps['browser']) {
                    window.luminaKernel.apps['browser'].open();
                    window.luminaKernel.apps['browser'].updateView(tabInfo.url, html);
                }
            } catch (e) {
                console.error("Failed to mirror agent view:", e);
            }

            // 2. Think
            const prompt = this.constructPrompt(goal, domSnapshot, this.history);
            const response = await this.callAI(prompt);

            this.history.push({ role: 'assistant', content: response });

            // 3. Act
            const action = this.parseAction(response);
            if (!action) {
                this.log('Agent decided to stop or failed to parse action.', 'error');
                break;
            }

            if (action.type === 'answer') {
                this.log(`🎯 FINAL ANSWER:\n${action.params.text}`, 'success');
                break;
            }

            if (action.type === 'finish') {
                this.log('Agent finished task.', 'info');
                break;
            }

            this.log(`Action: ${action.type} ${JSON.stringify(action.params)}`, 'info');
            await this.executor.execute(action.type, action.params, this.targetTabId);
            step++;

            // Wait a bit for page to settle
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    constructPrompt(goal, dom, history) {
        // Simple prompt construction
        return `
You are an autonomous browser agent.
GOAL: ${goal}

CURRENT BROWSER STATE (Simplified DOM):
${dom}

HISTORY:
${history.map(h => h.content).join('\n')}

INSTRUCTIONS:
- Analyze the DOM to find elements relevant to the goal.
- Return a JSON object with your next action.
- Supported actions:
  - { "type": "click", "params": { "id": "element_id" } }
  - { "type": "type", "params": { "id": "element_id", "text": "some text" } }
  - { "type": "scroll", "params": { "direction": "up" | "down" } }
  - { "type": "navigate", "params": { "url": "https://..." } }
  - { "type": "answer", "params": { "text": "The extracted information or final summary" } }
  - { "type": "finish", "params": {} }

RESPONSE FORMAT:
Strictly JSON only. No markdown.
`;
    }

    async callAI(prompt) {
        // Send message to background service to call LLM
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: "agent_completion", // We need to handle this in background.js
                prompt: prompt
            }, response => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(response.text);
                }
            });
        });
    }

    parseAction(response) {
        try {
            // Use regex to locate the first JSON object block in the response,
            // bypassing any conversational text the LLM might hallucinate.
            const jsonMatch = response.match(/\{[\s\S]*\}/);

            if (!jsonMatch) {
                // If there is no JSON at all, the LLM might have just dumped the summary natively.
                // Let's check if the response is a substantial string and not just "ok" or "done".
                const cleanedResponse = response.trim();
                if (cleanedResponse.length > 20 && !cleanedResponse.includes('"type":')) {
                    this.log(`Attempting fallback parser. Interpreting raw string as 'answer' action.`, 'info');
                    return {
                        type: 'answer',
                        params: { text: cleanedResponse }
                    };
                }
                throw new Error("No JSON object found in response, and response was not a valid raw answer block.");
            }

            const jsonStr = jsonMatch[0];
            return JSON.parse(jsonStr);
        } catch (e) {
            this.log(`Failed to parse Agent action: ${e.message}`, 'error');
            console.error('Raw response was:', response);
            return null;
        }
    }
}
