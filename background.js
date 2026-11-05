/*
 * Lumina - AI Browser Extension
 * Copyright (c) 2026 Harsh Raj Singh. All Rights Reserved.
 *
 * This code is proprietary. Unauthorized copying of this file, via any medium is strictly prohibited.
 */


import { callOpenRouter } from './services/openrouter.js';
import { callGemini } from './services/gemini.js';

// Setup Context Menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "explain_with_lumina",
    title: "Explain with Lumina",
    contexts: ["selection"]
  });
});

let overlayWindowId = null;

// Allows users to open the side panel by clicking on the action toolbar icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

function openLuminaPopup() {
  chrome.windows.getCurrent({ populate: false }, (window) => {
    chrome.sidePanel.open({ windowId: window.id }).then(() => {
      // Tell the existing window to check storage for new triggers
      chrome.runtime.sendMessage({ action: 'check_triggers' }).catch(() => { });
    }).catch(err => console.error(err));
  });
}


function handleExplainRequest(text) {
  if (text) {
    chrome.storage.local.set({ 'pending_explanation': text });
  }
  openLuminaPopup();
}

// Handle Context Menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "explain_with_lumina" && info.selectionText) {
    handleExplainRequest(info.selectionText);
  }
});

// --- No Screenshot Accumulator needed for Live Streaming ---
let isCapturing = false;
let isCreatingOverlayWindow = false;

// Handle Keyboard Shortcut command
chrome.commands.onCommand.addListener(async (command) => {
  if (isCapturing) return;

  if (command === "silent_java_solver" || command === "silent_system_design" || command === "silent_code_review") {
    isCapturing = true;

    // 1. Silent Screenshot
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, async (dataUrl) => {
      isCapturing = false;
      if (chrome.runtime.lastError) {
        console.error("Lumina: Capture error", chrome.runtime.lastError);
        return;
      }

      // Indicate to user we grabbed a frame
      chrome.action.setBadgeText({ text: "✓" });
      chrome.action.setBadgeBackgroundColor({ color: "#75ff8f" });
      setTimeout(() => chrome.action.setBadgeText({ text: "" }), 1000);

      try {
        const keys = await chrome.storage.local.get(['geminiKey', 'overlay_context_history']);
        const apiKey = keys.geminiKey;
        if (!apiKey) {
          console.error("No Gemini API key found.");
          return;
        }

        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs || tabs.length === 0) return;
        const activeTab = tabs[0];
        const activeTabId = activeTab.id;

        // Check if it's a restricted page where content scripts cannot be injected
        if (activeTab.url && (activeTab.url.startsWith('chrome://') || activeTab.url.startsWith('edge://') || activeTab.url.startsWith('about:'))) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'assets/icon128.png',
            title: 'Lumina Access Denied',
            message: 'Overlays cannot be displayed on internal browser pages. Please refresh a normal website (like HackerRank or Wikipedia) and try again.'
          });
          return;
        }

        if (!overlayWindowId && !isCreatingOverlayWindow) {
          isCreatingOverlayWindow = true;
          // --- First Capture: Spawn Window and Start Initial Request ---

          // Identify prompt
          let prompt = "";
          if (command === "silent_java_solver") {
            prompt = "Explain and solve this problem. First, provide a brief understanding of the core concepts in both Java and Python so I can teach it to a class with students from both backgrounds. Second, briefly explain a brute-force approach including its time and space complexity. Finally, provide the most optimal code solutions in BOTH Java and Python with brief explanations, along with their time and space complexity. FORMATTING RULE: Format your response beautifully using Markdown. Use clear headings (##), bullet points for concepts, and properly indented code blocks. Ensure the explanation is structured neatly and reads like well-documented notes tailored for a classroom presentation.";
          } else if (command === "silent_system_design") {
            prompt = `Help me with this system design problem. I am speaking to an interviewer right now. Think of this interview as a discussion and guide the interview in this manner.\n\nStructure your response EXACTLY like this FAANG-expert pattern:\n1. **Ask clarifying questions:** Define Scope, Functional Requirements, Non-functional requirements, Scale assumptions, and Constraints.\n2. **Design high-level:** Outline APIs, core services/components, traffic management/data flows, and core entities.\n3. **Drill down on your design:** Discuss database choices with trade-offs (SQL vs NoSQL, sharding, replication), specific component details, performance and reliability considerations, and potential bottlenecks.\n4. **Bring it all together:** Recap the system flows, explain how non-functional goals were met, and suggest future improvements or extensions.\n\nIMPORTANT: Phrase your entire answer precisely as if I am speaking it directly to the interviewer right now. Keep it conversational but highly technical. Guide the discussion step-by-step. NEVER use short forms or abbreviations without providing the full form in brackets.`;
          } else if (command === "silent_code_review") {
            prompt = "Perform a thorough code review of the code in the screenshot. Identify bugs, security vulnerabilities, performance issues, and suggest improvements with code snippets. IMPORTANT: Phrase your entire answer precisely as if I am speaking it directly to the interviewer right now using the STAR (Situation, Task, Action, Result) method. Keep it conversational but highly technical. Also, NEVER use short forms or abbreviations without providing the full form in brackets.";
          }

          let statusHtml = `<div style="text-align:center; color: #ddd; margin-top: 40px;"><br><b>🧠 Analyzing screenshot via Gemini Flash...</b>`;
          if (command === "silent_system_design") {
            statusHtml += `<br><br><small style="color: #4CAF50;">Structuring system architecture...</small><br><br><small style="opacity: 0.6;"><i>This takes about 5-8 seconds. Sit tight!</i><br><br><b>Hint:</b> Press Cmd+Shift+2 again while reading to seamlessly append the next page of the problem!</small>`;
          } else {
            statusHtml += `<br><br><small style="opacity: 0.6;"><i>This usually takes 5-8 seconds. Sit tight!</i><br><br><b>Hint:</b> Press Cmd+Shift+1 again while reading to seamlessly append the next page of the code!</small>`;
          }
          statusHtml += `</div>`;
          chrome.storage.local.set({ overlay_status: statusHtml, overlay_answer: null });

          const currentWindow = await chrome.windows.getCurrent();
          const overlayWidth = 450;
          const overlayHeight = 800;
          const leftTarget = Math.max(0, currentWindow.left + currentWindow.width - overlayWidth - 50);
          const topTarget = currentWindow.top + 50;

          chrome.windows.create({
            url: "overlay.html",
            type: "popup",
            state: "normal",
            width: overlayWidth,
            height: overlayHeight,
            top: topTarget,
            left: leftTarget,
            focused: true
          }, (newWin) => {
            isCreatingOverlayWindow = false;
            if (newWin) {
              overlayWindowId = newWin.id;
              // Hack for macOS native fullscreen: Force update the bounds
              setTimeout(() => {
                chrome.windows.update(newWin.id, {
                  state: "normal", width: overlayWidth, height: overlayHeight, top: topTarget, left: leftTarget, focused: true
                }).catch(() => { });
              }, 300);
            }
          });

          // Inject Anti-Cheat to prevent Blur detection when Overlay window opens
          chrome.scripting.executeScript({
            target: { tabId: activeTabId },
            world: "MAIN",
            func: () => {
              // Prevent multiple injections
              if (window.__lumina_stealth_active) return;
              window.__lumina_stealth_active = true;

              // 1. Intercept Event Listeners
              const originalAddEventListener = EventTarget.prototype.addEventListener;
              EventTarget.prototype.addEventListener = function (type, listener, options) {
                if (type === 'blur' || type === 'visibilitychange' || type === 'mouseleave') {
                  return; // Drop the listener silently
                }
                return originalAddEventListener.apply(this, arguments);
              };

              // 2. Override Document Visibility APIs
              Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });
              Object.defineProperty(document, 'hidden', { get: () => false, configurable: true });
              Object.defineProperty(document, 'hasFocus', { value: () => true, configurable: true });

              // 3. Wipe generic DOM level 0 handlers
              window.onblur = null;
              document.onvisibilitychange = null;
            }
          }).catch(e => console.warn("Failed to inject Anti-Cheat", e));

          // Call API seamlessly
          const result = await callGemini(apiKey, [dataUrl], prompt, null);

          // We save the image to context history for followups
          chrome.storage.local.set({
            overlay_status: null,
            overlay_answer: result,
            overlay_context_image: dataUrl,
            overlay_context_history: [
              { role: "user", content: prompt },
              { role: "model", content: result }
            ]
          });

        } else if (overlayWindowId) {
          // --- Subsequent Capture: Live Appending via Follow-up ---
          // Ensure window is brought to front
          chrome.windows.update(overlayWindowId, { focused: true }).catch(() => {
            overlayWindowId = null; // if fail, reset it
          });

          let statusHtml = `<div style="text-align:center; color: #ddd; margin-top: 40px;"><br><b>📸 Appending new screenshot and updating answer...</b><br><br><small style="opacity: 0.6;"><i>Context updating, please wait 5-8 seconds...</i></small></div>`;
          // Wipe current answer visually to show it's loading the new context
          chrome.storage.local.set({ overlay_status: statusHtml, overlay_answer: null });

          const followUpPrompt = "Here is the next part of the problem on the screen. Please update your previous solution or system design based on this new information.";
          const history = keys.overlay_context_history || [];

          // Call API with history
          const result = await callGemini(apiKey, [dataUrl], followUpPrompt, history);

          // Append to history
          const updatedHistory = [...history, { role: "user", content: "Attached next screenshot part. " + followUpPrompt }, { role: "model", content: result }];

          chrome.storage.local.set({
            overlay_status: null,
            overlay_answer: result,
            overlay_context_image: dataUrl,
            overlay_context_history: updatedHistory
          });
        }
      } catch (error) {
        isCapturing = false;
        isCreatingOverlayWindow = false;
        console.error("Silent solver failed:", error);
        chrome.storage.local.set({ overlay_status: `<div style="text-align:center; color: #ff5252; margin-top: 40px;"><br><b>❌ Error communicating with AI</b><br><small>${error.message}</small></div>`, overlay_answer: null });
      }
    });

  } else if (command === "show_lumina_architecture") {
    // No screenshot needed, just open the popup and trigger the display
    chrome.storage.local.set({ 'show_architecture_trigger': true }, () => {
      openLuminaPopup();
    });
  }
});

// The action.onClicked listener has been removed since setPanelBehavior handles it.

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'explainText') { // Legacy fallback
    handleExplainRequest(message.text);
  }

  if (message.action === 'agent_completion') {
    (async () => {
      try {
        const keys = await chrome.storage.local.get('geminiKey');
        const apiKey = keys.geminiKey;
        if (!apiKey) {
          sendResponse({ text: JSON.stringify({ type: "finish", params: { reason: "No Gemini API Key found. Please set it in settings." } }) });
          return;
        }

        const result = await callGemini(apiKey, null, message.prompt, []);
        sendResponse({ text: result });
      } catch (error) {
        console.error(error);
        sendResponse({ text: JSON.stringify({ type: "finish", params: { reason: "API Error: " + error.message } }) });
      }
    })();
    return true; // Keep channel open for async response
  }

  if (message.action === 'overlay_followup') {
    (async () => {
      try {
        const keys = await chrome.storage.local.get(['geminiKey', 'overlay_context_image', 'overlay_context_history']);
        const apiKey = keys.geminiKey;
        if (!apiKey) {
          chrome.storage.local.set({ overlay_status: "No API key found.", overlay_answer: null });
          return;
        }

        const history = keys.overlay_context_history || [];
        const imageUrl = keys.overlay_context_image;
        const followupPrompt = `The interviewer just asked/stated: "${message.text}". Please update the active solution or design accordingly. Do not restate everything, just update and explain the relevant parts. Remember to maintain the same conversational, technical, and full-form syntax as before.`;

        // We only send the image if this is the first turn or if the Gemini API requires it. In callGemini mapping, 
        // the current parts are appended to the history.
        const result = await callGemini(apiKey, imageUrl, followupPrompt, history);

        // Update history
        history.push({ role: "user", content: followupPrompt });
        history.push({ role: "model", content: result });

        chrome.storage.local.set({
          overlay_status: null,
          overlay_answer: result,
          overlay_context_history: history
        });
      } catch (error) {
        console.error("Overlay followup error:", error);
        chrome.storage.local.set({ overlay_status: "Error understanding followup: " + error.message, overlay_answer: null });
      }
    })();
    return true;
  }

  return true; // Keep channel open for async response
});
