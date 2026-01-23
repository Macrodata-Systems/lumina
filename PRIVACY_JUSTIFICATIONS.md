# Form Field Answers (Copy & Paste these)

## 1. Description Fields
**Single purpose description**
> Lumina is an AI-powered side panel that allows users to capture and analyze the content of their current web page (text and screenshots) using Large Language Models like Gemini, GPT-4, DeepSeek, and Claude.

## 2. Permission Justifications

**activeTab justification**
> Required to capture the visible tab's screenshot and text content only when the user explicitly interacts with the extension (clicks 'Explain' or the icon).

**storage justification**
> Used to save the user's configuration (API keys, theme preference) locally on their device. No data is sent to external servers.

**sidePanel justification**
> The core interface of the extension is a persistent side panel, allowing users to read AI explanations alongside the source web page.

**scripting justification**
> Used to programmatically extract the text content (document.body.innerText) of the active tab to provide context for the AI analysis.

**Host permission justification**
> Required to allow the user to analyze content on any website they visit. The extension accesses the current page's content only when requested by the user.

## 3. Remote Code
**Are you using remote code?**
> **NO** (Select "No, I am not using Remote code").

## 4. Data Usage
**What user data do you plan to collect?**
*   **Website content**: [x] Checked.
    *   *Note: This is because you read the page text to send to AI.*

**Certifications:**
*   Check all 3 boxes ("I do not sell...", "I do not use...", "I do not use...").

## 5. Privacy Policy URL
You **MUST** provide a link to a privacy policy.
1.  Copy the content from `PRIVACY_POLICY_TEMPLATE.md` (I created this for you).
2.  Paste it into a **Notion Page**, **GitHub Gist**, or **Google Doc**.
3.  Publish it to the web and paste the **Link** here.
