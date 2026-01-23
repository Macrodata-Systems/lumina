# How to Fix "Unable to Publish" Errors

The screenshot shows 3 errors. Here is how to fix them specifically:

## Error 1: "Privacy policy link is not reachable"
**The Reason**: Your GitHub repository is likely **Private**, so Google cannot verify the link to `PRIVACY.md`.
**The Fix**: Use a **Public Gist** instead.
1.  Open the file `PRIVACY.md` in your workspace and copy all text.
2.  Go to **[gist.github.com](https://gist.github.com)**.
3.  Paste the text. Name the file `privacy.md`.
4.  Click **"Create public gist"** (Button must say Public, not Secret).
5.  Copy the new URL (e.g., `gist.github.com/singhharsh199/...`).
6.  Paste **this new URL** into the Store Dashboard's "Privacy policy URL" field.

## Error 2 & 3: "You must provide/verify a contact email"
**The Fix**:
1.  In the Chrome Web Store Dashboard, look at the **Left Sidebar**.
2.  Click on **Account** (usually at the very bottom).
3.  Find the **"Contact email"** field.
4.  Enter your email address (`singhharsh199@gmail.com`).
5.  Click **Save**.
6.  **Crucial Step**: Go to your Gmail Inbox. Look for a verification email from Google. **Click the link inside it.**
7.  Refresh the Developer Dashboard page.

Once you do these two things, click **"Submit for Review"** again!
