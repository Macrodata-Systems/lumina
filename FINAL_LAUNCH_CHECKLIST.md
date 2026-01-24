# 🚀 Lumina Final Launch Checklist

This document contains the exact manual steps you need to perform to get your "All-Inclusive" AI extension live and secure.

---

## 🏗️ Phase 1: Setup Your Secure Backend (From Scratch)
Since you currently have no projects in Google Apps Script, follow these exact steps:

1.  **Go to Dashboard**: Open [script.google.com](https://script.google.com).
2.  **Create Project**: Click the big **+ New project** button in the top-left corner.
3.  **Rename**: Click on "Untitled project" at the top and change it to **"Lumina Secure Backend"**.
4.  **Prepare Editor**: You will see a file named `Code.gs`. **Delete all the default code** inside it.
5.  **Paste Code**: Copy the entire content of `backend/server.gs` from your local Lumina folder and paste it into the empty editor.
6.  **Insert Your Details**: I've pre-filled your Sheet ID below. Ensure lines 4 and 14 in your script look like this:
    ```javascript
    const SHEET_ID = "15wV71ItpuyYQAhFAxaLMDuH4YZPLZisogvvFh-PIAlg";

    const PROXY_KEYS = {
      gemini: "YOUR_REAL_GEMINI_KEY",
      openai: "YOUR_REAL_OPENAI_KEY"
    };
    ```
7.  **Save**: Click the **Save (Floppy Disk)** icon or press `Cmd + S`.

---

## 🌐 Phase 2: Deploying the Secure Proxy
You must publish the script so the extension can reach it.

1.  **Deploy**: Click the blue **Deploy** button (top right) -> **New Deployment**.
2.  **Select Type**: Click the gear icon next to "Select type" and choose **Web App**.
3.  **Configuration**:
    - **Description**: `Secure AI Proxy v1.80`.
    - **Execute as**: `Me` (Your email).
    - **Who has access**: `Anyone` (CRITICAL: Do not select "Anyone with Google account").
4.  **Deploy**: Click the blue **Deploy** button.
5.  **Authorize**: Click **Authorize Access**, select your account, and click **Allow**. (If you see "Google hasn't verified this app," click *Advanced* and then *Go to Lumina Secure Backend (unsafe)*).
6.  **Copy URL**: Under "Web App," copy the **URL** (it ends in `/exec`).

---

## ✅ PROD DEPLOYMENT DETAILS (KEEP THIS SECRET)
- **Deployment ID**: `AKfycbwkAOdRUy91qJ6eT-Xo9RxkeiURR31uXNwgJxrVEOmneCdoiES5y6PAZ8fHsUcQJYzY`
- **Web App URL**: `https://script.google.com/macros/s/AKfycbwkAOdRUy91qJ6eT-Xo9RxkeiURR31uXNwgJxrVEOmneCdoiES5y6PAZ8fHsUcQJYzY/exec`

---

## ⚙️ Phase 3: Final Extension Configuration
Now, link the Chrome extension to your new secure server.

1.  **Update Config**: Open `config.js` in your VS Code / Editor.
2.  **Paste URL**: Set `licenseServerUrl` to the URL you just copied:
    ```javascript
    export const API_CONFIG = {
        licenseServerUrl: "PASTE_YOUR_URL_HERE",
        developerMode: false, // Ensure this is false for the public
        // ... leave all other keys EMPTY ""
    };
    ```
3.  **Verification**: 
    - Open the extension sidepanel.
    - Click the copyright at the bottom **7 times** (Admin Door).
    - Toggle `Developer Mode` to **OFF**.
    - Try to explain a page. If it works, your **Proxy** is active!

---

## 📦 Phase 4: Chrome Web Store Submission
Prepare the package for the reviewers.

1.  **Locate ZIP**: Use the file: `builds/lumina-package-v1.80-secure-store.zip`.
    - *Note: This ZIP contains no API keys in its source code.*
2.  **Developer Console**: Log in to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole).
3.  **Upload**: Upload the ZIP file.
4.  **Privacy Settings (Important)**:
    - **Single Purpose**: State that the extension "Explains web content using AI."
    - **Permissions**: Explain that you need `tabs` to read the current page and `activeTab` for screenshots.
    - **Data Usage**: State that you do **not** sell user data. You only send data to your private proxy for AI processing.
5.  **Submit**: Click "Submit for Review".

**Lumina is ready to shine. Good luck with the launch! 💎🚀✨**
