# Lumina - Project Walkthrough

**Lumina** is a Chrome Extension that provides an AI "Second Brain" in the side panel. It allows users to capture the content of their active tab (screenshot and text) and ask questions using multiple LLMs.

## 🌟 Key Features
-   **Multi-Model Support**:
    -   **Gemini Flash**: Free tier (BYOK).
    -   **GPT-4o, Claude 3.5 Sonnet, DeepSeek R1**: Pro tier (BYOK + License Check).
-   **Visual Analysis**: Captures screenshots of the active tab for multimodal analysis.
-   **Page Context**: Scrapes `document.body.innerText` for deep context.
-   **History System**: Saves prompts and responses locally (Pro users).
-   **Voice Input**: Web Speech API integration.

## 🛠️ Architecture
-   **Manifest V3**: Uses `sidePanel`, `activeTab`, `scripting`, and `storage` permissions.
-   **Privacy First**: All API keys are stored in `chrome.storage.local`. Calls are made directly from the client to AI providers.
-   **Monetization**:
    -   **Pro Gate**: Checks for a license key (e.g., `Lumina-Pro-XXX`).
    -   **Features**: History and Premium Models are hidden/locked for non-Pro users.

## 🚀 Publishing Status
-   **Store Listing**: Created with optimized copy and promo images.
-   **Privacy Policy**: Hosted on GitHub Gist.
-   **Status**: **Pending Review** (Submitted Jan 2026).

## 📂 Project Structure
-   `manifest.json`: Extension config.
-   `sidepanel.html/js`: Core UI and Logic.
-   `services/`: Modules for each AI provider (`gemini.js`, `openai.js`, etc.).
-   `styles.css`: Dark/Light mode and UI styling.
-   `PRIVACY.md` / `STORE_LISTING.md`: Documentation assets.
