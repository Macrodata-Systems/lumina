import { ActionExecutor } from './os/agent/executor.js';

async function verify() {
    console.log("Creating Executor...");
    const executor = new ActionExecutor();
    try {
        // Can't easily test chrome.tabs directly in node but we can check syntax 
        console.log("Loaded ActionExecutor successfully");
    } catch (e) {
        console.error(e);
    }
}
verify();
