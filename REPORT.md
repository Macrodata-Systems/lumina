# Project Report: Lumina

## 1. Project Overview

**Lumina** is a browser extension designed to bridge the gap between visual content consumption and deep understanding. By integrating multiple Large Multimodal Models (LMMs), it allows users to instantly "query" any visual context in their browser—be it a slide deck, scientific diagram, or foreign language article.

## 2. Technical Architecture

### 2.1 Manifest V3 & Side Panel
The extension utilizes **Manifest V3**, the latest iteration of the Chrome Extension platform.
-   **Side Panel API**: We migrated from a popup to a dedicated **Side Panel** (`sidePanel` permission) to allow persistent interaction alongside the web content.
-   **Service Workers**: used for the background script (`background.js`) to handle context changes and side panel behavior.
-   **Promises**: Heavy use of async/await for cleaner asynchronous logic (tabs capture, storage, API calls).

### 2.2 Permissions
We minimized permissions to only what is strictly necessary:
-   `activeTab`: Grants temporary access to the current tab when the user interacts with the extension.
-   `storage`: Necessary for securely persisting user API keys locally.
-   `sidePanel`: To open the persistent sidebar UI.
-   `scripting`: To inject scripts for scraping page text (`document.body.innerText`).
-   `host_permissions`: `<all_urls>` is used to ensuring reliable screen capture across all domains.

### 2.3 API Integration Strategy
The extension calls AI provider APIs directly from the client side services.
-   **Supported Models**: Gemini 1.5 Flash, GPT-4o, Claude 3.5 Sonnet, and **DeepSeek R1 (Reasoner)**.
-   **DeepSeek Integration**: Added a dedicated service for DeepSeek, utilizing the `deepseek-reasoner` model to provide "Chain of Thought" reasoning alongside the final answer.

## 3. Design Decisions

### 3.1 Super Prompt Bar
We redesigned the input interface into a unified "Super Prompt Bar".
-   **Unified Input**: Combines text input, voice input, and context toggles in a single pill-shaped component.
-   **Voice Input**: Integrated the **Web Speech API** to allow users to dictate prompts directly.
-   **Context Control**: Toggles for "Screenshot" (📸) and "Page Text" (📄) allow users to granularly control what context is sent to the AI, saving tokens and improving relevant accuracy.

### 3.2 DeepSeek Chain of Thought
We integrated DeepSeek specifically to leverage its reasoning capabilities.
-   **Decision**: Instead of just showing the answer, we parse the `reasoning_content` from the API response.
-   **UI Implementation**: This is displayed in a collapsible `<details>` section ("🦈 DeepSeek Thought Process") above the answer, giving users insight into the model's logic without cluttering the view.

### 3.3 Robust Flexbox Layout
We moved away from sticky positioning to a **Flexbox Application Layout**.
-   **Stability**: The header (Prompt Bar) is fixed, while the results area scrolls independently. This prevents UI elements from being cut off or overlapping on smaller screens.
-   **Responsiveness**: The layout adapts fluidly to the side panel's width.

### 3.4 Zero-Click Experience (Refined)
While we support auto-explanation, the new UI empowers the user to drive the interaction.
-   **Manual Control**: Users can now choose to "Load Page Text" or toggle screenshots before sending a query, preventing accidental/unwanted API usage.

## 4. Challenges & Solutions

-   **DeepSeek V3 Limitations**: DeepSeek V3 is currently text-optimized and does not support image inputs in the same way as multimodal models.
    -   *Solution*: We ensure the prompt includes scraped page text to provide context even without the screenshot for text-heavy pages.
-   **Audio Permissions**: 
    -   *Challenge*: Microphone access can be blocked by browser policies.
    -   *Solution*: Added explicit error handling in `sidepanel.js` to catch `not-allowed` errors and guide the user to the extension settings page.
-   **Assets & CSP**:
    -   *Solution*: Continued use of standard Emojis (⚙️, ✨, 🦈) to avoid external font dependencies.

## 5. Future Improvements

-   **Chat Mode**: Allow threaded conversations.
-   **TTS**: Text-to-speech reading of the explanation.
-   **History**: Save past explanations for later review.
