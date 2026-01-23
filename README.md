# Universal Explainer

**Universal Explainer** is a Chrome Extension that leverages the power of multiple GenAI models (Gemini, ChatGPT, and Claude) to explain *anything* currently visible on your screen. Whether it's a presentation slide, a complex research paper, a news article, or a data dashboard, this extension provides instant, multi-perspective insights.

![App Icon](icon.png)

## Features

-   **Universal Capture**: Takes a screenshot of your active tab.
-   **Multi-Model Intelligence**: Get explanations from three leading AI models simultaneously:
    -   **Google Gemini 1.5 Flash**
    -   **OpenAI GPT-4o**
    -   **Anthropic Claude 3.5 Sonnet**
-   **Side-by-Side Comparison**: Compare how different AIs interpret the same content.
-   **Secure**: Your API keys are stored locally in your browser (`chrome.storage.local`) and never sent to our servers.

## Installation

Since this is a developer preview (unpacked extension):

1.  **Clone/Download** this repository.
2.  Open Chrome and navigate to `chrome://extensions`.
3.  Enable **Developer mode** (top right toggle).
4.  Click **Load unpacked** (top left).
5.  Select the folder containing this project (where `manifest.json` is located).

## Configuration

1.  Click the **Universal Explainer** extension icon in your toolbar.
2.  Click the **Settings (Gear)** icon in the top-right corner of the popup.
3.  Enter your API Keys for the services you wish to use:
    -   [Get Gemini Key](https://aistudio.google.com/app/apikey)
    -   [Get OpenAI Key](https://platform.openai.com/api-keys)
    -   [Get Anthropic Key](https://console.anthropic.com/settings/keys)
4.  Click **Save**.

## Usage

1.  Navigate to any webpage you want to understand better.
2.  Click the extension icon.
3.  Click the **Explain Page** button.
4.  Wait for the analysis to stream in from the configured models.

## Technologies Used

-   **Manifest V3**: Modern Chrome Extension architecture.
-   **Vanilla JS/HTML/CSS**: Lightweight and fast, no heavy build steps required.
-   **REST APIs**: Direct integration with AI providers.

## License

MIT
