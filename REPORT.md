# Project Report: Lumina

## 1. Project Overview

**Lumina** is a browser extension designed to bridge the gap between visual content consumption and deep understanding. By integrating multiple Large Multimodal Models (LMMs), it allows users to instantly "query" any visual context in their browser—be it a slide deck, a scientific diagram, or a foreign language article.

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
    -   *Mitigation*: Chrome Extensions have privileged access to make cross-origin requests if configured correctly. We implemented direct fetch calls which work seamlessly within the extension context.

## 3. Design Decisions

### 3.1 From "Slide Explainer" to "Lumina"
Initially scoped as a tool for explaining presentation slides, we realized the underlying technology (Screenshot -> AI) is agnostic to the content.
-   **Pivot**: Rebranded to "Lumina" to reflect its ability to shed light on any specific topic or screen.
-   **Impact**: UI wording changed from specific "Slide" terminology to generic "Explanation". The prompt remains flexible to allow the AI to infer context from the image itself.

### 3.2 Zero-Click Experience
We prioritized speed and friction reduction. Use cases often involve quickly checking a slide or graph.
-   **Decision**: Instead of requiring a "Take Screenshot" button press, the extension **automatically captures and starts explaining** as soon as the popup opens.
-   **Benefit**: Reduces user interaction time significantly.
-   **Fallback**: A manual "Explain" button remains hidden but accessible via code logic if we need to expose it for retries in the future.

### 3.3 Multi-Model Vertical Stack
We chose a **vertical stack** layout for results rather than tabs.
-   **Reasoning**: This allows users to scroll and quickly compare the length and quality of responses from Gemini, GPT-4o, and Claude without clicking back and forth. It reinforces the "comparison" value proposition.

## 4. Challenges & Solutions

-   **API Key Management**: Asking users for 3 keys is high friction.
    -   *Solution*: The UI gracefully handles missing keys. If only Gemini is configured, only the Gemini section works, and others show a helpful "Not configured" message rather than breaking the app.
-   **Screenshot Quality**:
    -   *Solution*: Used `jpeg` with `80` quality. This is a good balance between visual fidelity for OCR/Analysis and payload size for API limits.

## 5. Future Improvements

-   **Context Menu**: Add a right-click "Explain this image" for specific elements.
-   **Chat Mode**: Allow follow-up questions on the explanation (e.g., "Summarize this more simply").
-   **TTS**: Text-to-speech reading of the explanation.
