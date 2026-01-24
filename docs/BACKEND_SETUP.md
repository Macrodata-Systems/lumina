# How to Deploy Your License Server (Free)

Since you are taking payments manually, you need a way to generate keys and verify them. We use **Google Apps Script** for this.

## 1. Create the Database
1.  Go to [Google Sheets](https://sheets.google.com).
2.  Create a new Sheet named **"Lumina Licenses"**.
3.  Rename the bottom tab to **"Licenses"**.
4.  In Row 1, add headers: `Email` | `LicenseKey` | `Active` | `CreatedAt` | `ExpiryDate` | `Status` | `PaymentVerified`.

## 2. Deploy the Backend Code
1.  Open the Sheet. Go to **Extensions** -> **Apps Script**.
2.  Delete any code in `Code.gs`.
3.  Copy the code from `backend/server.gs` in your project folder and paste it here.
4.  **Edit the Code**:
    *   Copy your Sheet ID from the URL (between `/d/` and `/edit`) and paste it into `const SHEET_ID = "..."`.
    *   Change `USER_EMAIL_HERE` in the admin function if you are testing.

## 3. Publish as API
1.  Click **Deploy** (blue button) -> **New deployment**.
2.  Select type: **Web app**.
3.  Description: "License Server".
4.  Execute as: **Me**.
5.  Who has access: **Anyone** (Important! So the extension can call it).
6.  Click **Deploy**.
7.  Copy the **Web App URL** (ends in `/exec`).

## 4. Setup Professional Email (Resend.com)
To send emails from `noreply@lumina-ai.com`:
1.  Go to **[Resend.com](https://resend.com)** and sign up.
2.  Go to **Domains** -> **Add New Domain**.
3.  Add `lumina-ai.com` and follow the DNS verification steps (Adding MX/SPF records to your domain provider like GoDaddy/Namecheap).
4.  Once verified, go to **API Keys** and create a new key.
5.  In `backend/server.gs`, paste the key into `RESEND_API_KEY`.

## 5. Connect Extension
1.  Open `config.js` in your extension project.
2.  Paste the Apps Script URL into `licenseServerUrl`.
3.  Deploy the App Script as a "Web App" (Anyone).

## 6. Setup Automated Reminders (New)
To automatically send reminders 7, 5, 3, and 1 days before expiry:
1.  In your Apps Script editor, click the **Triggers** icon (clock) on the left sidebar.
2.  Click **+ Add Trigger** (bottom right).
3.  Choose function to run: `SEND_EXPIRY_REMINDERS`.
4.  Select event source: **Time-driven**.
5.  Select type of time based trigger: **Day timer**.
6.  Select time of day: **9am to 10am** (any time works).
7.  Click **Save**.

## 7. How It Works (Summary)
1.  **User enters email** in the extension.
2.  **User pays** via UPI or PayPal.
3.  **User clicks "Email My Key Now"**.
4.  System **generates key**, saves to Sheet, and **emails it from noreply@lumina-ai.com**.
5.  **Daily Trigger** checks the Sheet and sends reminders starting **1 week before expiry** every alternate day. 🚀
