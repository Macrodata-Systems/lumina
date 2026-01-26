# Chrome Web Store Submission Details (Lumina v1.2)

Use this document to copy-paste the required information into the Developer Dashboard.

---

## 1. Store Listing Tab

**Title:** `Lumina`
**Summary:** `Explain anything on your screen - Slides, Papers, News, Articles - using Gemini, OpenAI, Claude, Grok, and DeepSeek.`

**Description:**
*(Copy and paste the text block below)*

```text
Lumina gives you an AI "Second Brain" right in your browser.

Instantly analyze the content of any tab—whether it’s a YouTube lecture, a PDF slide deck, or a complex documentation page. Lumina sees what you see and explains it in seconds.

🚀 KEY FEATURES

*   **Multi-Model Intelligence:** Switch instantly between the world's best AI models:
    *   Google Gemini 1.5 Pro & Flash
    *   OpenAI GPT-4o
    *   Anthropic Claude 3.5 Sonnet
    *   Grok (xAI)
    *   DeepSeek R1 (with Chain-of-Thought reasoning)

*   **Visual Analysis:** "Snap" a screenshot of any chart, diagram, or UI and ask detailed questions.
*   **Smart Text Selection:** Select any text on a webpage and click the "Explain with Lumina" popup for instant analysis.
*   **Page Context:** Automatically reads the text of the webpage for context-aware summaries and answers.
*   **Privacy-First:** Your data stays yours. Lumina runs entirely in your browser side-panel. We do not track your usage.

💎 BRING YOUR OWN KEY (BYOK)

Lumina is a lightweight, privacy-focused client.
*   **No Subscriptions:** The extension is 100% free to download.
*   **You Control the Costs:** Simply enter your own API keys from Google, OpenAI, Anthropic, etc. You pay the providers directly (or use their free tiers) only for what you use.
*   **Local Storage:** Your API keys are saved securely in your browser's local storage and never sent to our servers.

⚡ PERFECT FOR...

*   **Students:** Snapshot lecture slides and get instant summaries.
*   **Developers:** Debug code snippets using DeepSeek's advanced reasoning.
*   **Researchers:** Switch between models to get different perspectives on the same content.
```

**Category:** `Productivity` / `Workflow & Planning`

---

## 2. Privacy Tab

**Single Purpose Description:**
`Lumina is an AI-powered side panel that allows users to capture and analyze the content of their current web page (text and screenshots) using Large Language Models like Gemini, GPT-4, Claude, Grok, and DeepSeek.`

**Privacy Policy URL:**
`https://gist.github.com/singhharsh199/7d6cb8674c1896270df689f66670f0e4`
*(Ensure the content of this Gist matches `docs/PRIVACY.md`)*

### **Permission Justifications**

*   **activeTab:**
    `Required to capture the visible tab's screenshot and text content only when the user explicitly interacts with the extension (clicks 'Explain' or the icon).`

*   **storage:**
    `Used to save the user's configuration (API keys, theme preference) locally on their device. No data is sent to external servers.`

*   **sidePanel:**
    `The core interface of the extension is a persistent side panel, allowing users to read AI explanations alongside the source web page.`

*   **scripting:**
    `Used to programmatically extract the text content (document.body.innerText) of the active tab to provide context for the AI analysis.`

*   **clipboardRead:**  *(New for v1.2)*
    `Required to allow users to quickly paste their API keys into the settings input fields directly from the system clipboard for better usability.`

*   **Host Permission (<all_urls>):**
    `Required to analyze content on any website the user visits (only when requested) and to connect to the various AI provider APIs (Google Gemini, OpenAI, Anthropic, xAI, DeepSeek) for generating responses.`

---

### **Data Usage & Certification**

**User Data Collected:**
*   Check **[x] Website Content** (Text, images, etc.)
    *   *Reason:* The extension reads the page content to send it to the AI for summarization/analysis.

**Certifications:**
*   Check **[x] I do not sell or transfer user data...**
*   Check **[x] I do not use or transfer user data for unrelated purposes...**
*   Check **[x] I do not use or transfer user data for creditworthiness...**

---

## 3. Package Tab

**Upload:** `lumina-v1.2.zip` (Located in the root of your project folder).
