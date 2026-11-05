
/**
 * Lumina Agent Action Executor
 * Executes actions on the target tab via Chrome Scripting API.
 */
export class ActionExecutor {
    constructor() {
    }

    async execute(action, params, tabId) {
        if (!tabId) throw new Error('No tabId provided');

        switch (action) {
            case 'click':
                return this.click(tabId, params.id);
            case 'type':
                return this.type(tabId, params.id, params.text);
            case 'scroll':
                return this.scroll(tabId, params.direction);
            case 'navigate':
                return this.navigate(tabId, params.url);
            case 'read':
                return this.read(tabId);
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }

    async click(tabId, elementId) {
        await chrome.scripting.executeScript({
            target: { tabId },
            func: (id) => {
                const el = document.querySelector(`[data-lumina-id="${id}"]`);
                if (el) {
                    el.click();
                    el.focus();
                } else {
                    throw new Error(`Element ${id} not found`);
                }
            },
            args: [elementId]
        });
        return `Clicked element ${elementId}`;
    }

    async type(tabId, elementId, text) {
        await chrome.scripting.executeScript({
            target: { tabId },
            func: (id, txt) => {
                const el = document.querySelector(`[data-lumina-id="${id}"]`);
                if (el) {
                    el.value = txt;
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                } else {
                    throw new Error(`Element ${id} not found`);
                }
            },
            args: [elementId, text]
        });
        return `Typed "${text}" into element ${elementId}`;
    }

    async scroll(tabId, direction) {
        const amount = direction === 'up' ? -500 : 500;
        await chrome.scripting.executeScript({
            target: { tabId },
            func: (amt) => window.scrollBy({ top: amt, behavior: 'smooth' }),
            args: [amount]
        });
        return `Scrolled ${direction}`;
    }

    async navigate(tabId, url) {
        await chrome.tabs.update(tabId, { url });
        return `Navigating to ${url}`;
    }

    async read(tabId) {
        // Inject the inspector first just in case
        await chrome.scripting.executeScript({
            target: { tabId },
            files: ['os/agent/dom.js']
        });

        const result = await chrome.scripting.executeScript({
            target: { tabId },
            func: () => window.LuminaInspector.getSnapshot()
        });

        return result[0].result;
    }

    async getOuterHTML(tabId) {
        const result = await chrome.scripting.executeScript({
            target: { tabId },
            func: () => document.documentElement.outerHTML
        });
        return result[0].result;
    }
}
