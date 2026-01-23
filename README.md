# Lumina

**Lumina** is a Chrome Extension that leverages the power of multiple GenAI models (Gemini, ChatGPT, and Claude) to explain *anything* currently visible on your screen. Whether it's a presentation slide, a complex research paper, a news article, or a data dashboard, **Lumina** provides instant, multi-perspective insights.

![App Icon](icon.png)

## Features

-   **Universal Capture**: Works on potentially any website (including restricted ones like LinkedIn) thanks to enhanced permissions.
-   **Always-On Intelligence**: Automatically re-analyzes the page when you **switch tabs** or **navigate** to a new URL.
-   **Multi-Model Intelligence**: Get explanations from three leading AI models simultaneously:
    -   **Google Gemini 1.5 Flash**
    -   **OpenAI GPT-4o**
    -   **Anthropic Claude 3.5 Sonnet**
-   **Focused Configuration**: Click the ⚙️ icon next to any model to quickly configure just that specific provider.
-   **Side-by-Side Comparison**: Compare how different AIs interpret the same content in a single view.
-   **Secure**: Your API keys are stored locally in your browser (`chrome.storage.local`) and never sent to our servers.

## Installation

Since this is a developer preview (unpacked extension):

1.  **Clone/Download** this repository.
2.  Open Chrome and navigate to `chrome://extensions`.
3.  Enable **Developer mode** (top right toggle).
4.  Click **Load unpacked** (top left).
5.  Select the folder containing this project (where `manifest.json` is located).

## Configuration

Lumina makes setup easy with direct links to get your keys:

1.  Click the **Lumina** extension icon (ensure it's pinned for easy access).
2.  Open the Side Panel.
3.  Click the **Gear Icon (⚙️)** next to any model (e.g., Gemini).
4.  Click the **"Get Key"** link to open the provider's API page:
    -   [Google AI Studio](https://aistudio.google.com/app/apikey)
    -   [OpenAI Platform](https://platform.openai.com/api-keys)
    -   [Anthropic Console](https://console.anthropic.com/settings/keys)
5.  Paste your key and click **Save**.

## Usage

1.  Navigate to any webpage, slide, or document you want to understand.
2.  Click the **Lumina** extension icon.
3.  **That's it!** Lumina will automatically capture the screen and stream explanations from your configured models.

## Technologies Used

-   **Manifest V3**: Modern Chrome Extension architecture.
-   **Vanilla JS/HTML/CSS**: Lightweight and fast, no heavy build steps required.
-   **REST APIs**: Direct integration with AI providers.

## License

MIT
