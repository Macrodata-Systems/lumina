# Publishing Lumina to the Chrome Web Store

This guide walks you through the steps to publish your extension for other users to use.

## 1. Prerequisites / Preparation

### Check Manifest
Ensure your `manifest.json` is production-ready.
- **Version**: Check `version` is correct (e.g. `1.1`).
- **Icons**: Ensure you have icon files (16, 32, 48, 128) in the root or an `assets` folder.
- **Permissions**: You use `<all_urls>` (host permission) to scrape page text.
    - **Note**: Chrome Web Store reviews for extensions requesting `<all_urls>` can take longer (days to weeks). You must justify why you need it (Answer: "To extract page text for AI analysis upon user request").

### Remove Hardcoded Keys
**CRITICAL**: You have a `config.js` file. Ensure `API_CONFIG` has **EMPTY** strings for the keys before you package it.
- Edit `config.js` and remove any personal keys.
- Users will enter their own keys in the extension settings.
- *If you want to provide a free trial with your own key, you'd need a backend proxy. Do NOT ship your raw API key in the extension code.*

### Create a Privacy Policy
Since you use Host Permissions (`<all_urls>`) and Active Tab, you likely need a Privacy Policy URL.
- Create a simple page (can be a GitHub Gist or a page in your repo) stating:
    - What data you collect (None, data is sent directly to AI providers).
    - That you don't store user data.
    - That API keys are stored locally (`chrome.storage.local`).

## 2. Package the Extension

1. **Clean up**: Remove any `.git` folders, `.DS_Store`, or extra dev files if possible (though the store zips only what's needed usually, it's cleaner to be precise).
2. **Zip**: Select all files inside your `Lumina` folder (manifest.json, background.js, popup/sidepanel files, icons) and zip them.
    - **Do NOT zip the parent folder.** Zip the *contents*.
    - On Mac: Select files -> Right Click -> Compress.
    - Name it `lumina-v1.1.zip`.

## 3. Developer Dashboard

1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard).
2. You need to pay a **one-time $5 registration fee** if you haven't already.
3. Click **"New Item"**.
4. Upload your `lumina-v1.1.zip` file.

## 4. Store Listing

Fill out the required fields:
- **Title**: Lumina
- **Summary**: Explain slides, news, and papers using AI (Gemini, OpenAI, DeepSeek).
- **Description**: Detailed features. Mention "Bring Your Own Key" (BYOK).
- **Category**: Productivity / Workflow.
- **Screenshots**: Upload at least one screenshot of the extension in action. (You can use the `generate_image` tool logic mentally to design these, or just take screenshots of your browser).

## 5. Privacy Practices

- **Host Permissions**: You must justify `<all_urls>`.
    - Justification: "The extension needs to read the text content of the current tab to send it to the AI for summarization/explanation. This only happens when the user clicks the 'Explain' button."
- **Data Usage**:
    - "Does your extension collect any of these data?" -> Generally **No**, unless you have analytics.
    - **Note**: You strictly need to declare that you send data to third parties (Gemini/OpenAI APIs), but usually, since it's user-initiated with their keys, it's often considered "Ephemeral". However, be transparent: "Data is sent to AI providers (Google, OpenAI, DeepSeek) for processing."

## 6. Submit for Review

1. Click **"Submit for Review"**.
2. Wait. Reviews can take 24 hours to a few weeks.
3. Once approved, it will be public!

## Alternative: "Unlisted" or "Developer Mode" Distribution

If you just want to share with a few friends without the store review:
1. **Unlisted**: Publish on the store but choose "Unlisted" visibility. Only people with the link can install. (Still requires Review).
2. **Manual Install (Developer Mode)**:
    - Send your `.zip` to your friend.
    - Tell them to unzip it.
    - Go to `chrome://extensions`.
    - Enable **Developer Mode** (top right).
    - Click **Load Unpacked**.
    - Select the unzipped folder.

---

## Technical Update: Chain of Thoughts

I have updated your `sidepanel.js` and `deepseek.js` to support **Streaming**.
- When using **DeepSeek**, the "Reasoning" block (<details>) will now update in real-time as the model "thinks".
- This provides the "Chain of Thought" experience you requested.
