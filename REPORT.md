# Project Report: Universal Explainer

## 1. Project Overview

**Universal Explainer** is a browser extension designed to bridge the gap between visual content consumption and deep understanding. By integrating multiple Large Multimodal Models (LMMs), it allows users to instantly "query" any visual context in their browser—be it a slide deck, a scientific diagram, or a foreign language article.

## 2. Technical Architecture

### 2.1 Manifest V3
The extension utilizes **Manifest V3**, the latest iteration of the Chrome Extension platform. Key changes from V2 include:
-   **Service Workers**: used for the background script (`background.js`), though in this lightweight implementation, most logic resides in the popup to reduce persistent memory usage.
-   **Promises**: Heavy use of async/await for cleaner asynchronous logic (tabs capture, storage, API calls).

### 2.2 Permissions
We minimized permissions to only what is strictly necessary:
-   `activeTab`: Grants temporary access to the current tab when the user interacts with the extension. This is privacy-preserving as it doesn't require broad "read all data on all websites" permission.
-   `storage`: Necessary for securely persisting user API keys locally.

### 2.3 API Integration Strategy
The extension calls AI provider APIs directly from the client side (`popup.js` / services).
-   **Pros**: Simplicity. No need for a middleman/backend server. User owns their keys.
-   **Cons**: Potential CORS (Cross-Origin Resource Sharing) issues.
    -   *Mitigation*: Chrome Extensions have privileged access to make cross-origin requests if configured correctly. For APIs that are strict (like Anthropic), this sometimes requires background script proxies, but for this iteration, direct fetch was implemented for simplicity, assuming direct browser access capability or future proxy implementation if needed.

## 3. Design Decisions

### 3.1 "Universal" vs "Slide"
Initially scoped as a "Slide Explainer", we quickly realized the underlying technology (Screenshot -> AI) is agnostic to the content.
-   **Pivot**: Renamed to "Universal Explainer".
-   **Impact**: UI wording changed from "Slide" to "Page". Prompt handling remained generic ("explain") to allow the AI to infer context from the image itself.

### 3.2 Multi-Model UI
We chose a **vertical stack** layout for results rather than tabs.
-   **Reasoning**: This allows users to scroll and quickly compare the length and quality of responses without clicking back and forth. It reinforces the "comparison" value proposition.

## 4. Challenges & Solutions

-   **API Key Management**: Asking users for 3 keys is high friction.
    -   *Solution*: The UI gracefully handles missing keys. If only Gemini is configured, only the Gemini section works, and others show a helpful "Not configured" message rather than breaking the app.
-   **Screenshot Quality**:
    -   *Solution*: Used `jpeg` with `80` quality. This is a good balance between visual fidelity for OCR/Analysis and payload size for API limits.

## 5. Future Improvements

-   **Context Menu**: Add a right-click "Explain this image" for specific elements.
-   **Chat Mode**: Allow follow-up questions on the explanation (e.g., "Summarize this more simply").
-   **TTS**: Text-to-speech reading of the explanation.
