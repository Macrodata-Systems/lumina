/*
 * Lumina - AI Browser Extension
 * Copyright (c) 2026 Harsh Raj Singh. All Rights Reserved.
 *
 * This code is proprietary. Unauthorized copying of this file, via any medium is strictly prohibited.
 */

// Background service worker
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'explainText') {
    // 1. Save text to storage so sidepanel can pick it up if it's currently closed
    chrome.storage.local.set({ 'pending_explanation': message.text });

    // 2. Open the side panel
    if (sender.tab && sender.tab.id) {
      chrome.sidePanel.open({ tabId: sender.tab.id, windowId: sender.tab.windowId })
        .catch((error) => console.error(error));
    }
  }
});
