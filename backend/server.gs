// Google Apps Script - Lumina Backend v6 (Global Beta Support)

// CONFIGURATION
const SHEET_ID = "REPLACE_WITH_YOUR_SHEET_ID";
const ADMIN_EMAIL = "singhharsh199@gmail.com";
const RESEND_API_KEY = "REPLACE_WITH_RESEND_API_KEY"; 
const FROM_EMAIL = "noreply@lumina-ai.com";

// --- GLOBAL BETA SETTINGS ---
const GLOBAL_BETA_ACTIVE = true; // Set to false after 6 months
const BETA_MESSAGE = "Early Bird Beta Active - Enjoy Pro features for free!";

/**
 * Handle incoming POST requests from the extension.
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action || "verify";

    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName("Licenses");
    if (!sheet) return createJSON({ valid: false, message: "Database Error" });

    // --- ACTION: VERIFY ---
    if (action === "verify") {
      // If Global Beta is active, everyone is Pro!
      if (GLOBAL_BETA_ACTIVE) {
        return createJSON({ valid: true, message: BETA_MESSAGE });
      }

      const keyToCheck = data.licenseKey;
      if (!keyToCheck) return createJSON({ valid: false, message: "No key provided" });

      const rows = sheet.getDataRange().getValues();
      const now = new Date();

      for (let i = 1; i < rows.length; i++) {
        const [email, key, active, createdAt, expiryDate] = rows[i];
        
        if (String(key).trim() === String(keyToCheck).trim()) {
          if (!(active === true || String(active).toUpperCase() === "TRUE")) {
             return createJSON({ valid: false, message: "License Revoked" });
          }

          if (expiryDate) {
            const exp = new Date(expiryDate);
            if (now > exp) return createJSON({ valid: false, message: "License Expired" });
          }

          return createJSON({ valid: true, message: "Active" });
        }
      }
      return createJSON({ valid: false, message: "Invalid Key" });
    }

    // --- ACTION: REQUEST KEY ---
    if (action === "request_key") {
      const userEmail = data.email.toLowerCase().trim();
      if (!userEmail) return createJSON({ success: false, message: "Email required" });

      // Prevent duplicate active keys for same email
      const dataRange = sheet.getDataRange().getValues();
      for (let i = 1; i < dataRange.length; i++) {
        const [mail, key, active] = dataRange[i];
        if (mail.toLowerCase() === userEmail && (active === true || String(active).toUpperCase() === "TRUE")) {
          return createJSON({ success: false, message: "An active key already exists." });
        }
      }

      const key = "LUMINA-" + Utilities.getUuid().slice(0, 12).toUpperCase();
      const now = new Date();
      const expiry = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

      const emailSent = sendEmailViaResend(
        userEmail,
        "Your Lumina Pro License Key 🚀",
        `Hi there,<br><br>Thanks for choosing Lumina Pro!<br><br>Your Annual License Key: <b>${key}</b><br>Expiry Date: <b>${expiry.toLocaleDateString()}</b><br><br>Note: You have been granted this key during our Early Bird Beta launch. Enjoy!<br><br>Best,<br>Harsh Raj Singh`
      );

      if (emailSent) {
        sheet.appendRow([userEmail, key, true, now, expiry, "SENT_BETA", "BETA_FREE"]);
        return createJSON({ success: true, message: "Key sent to your email!" });
      } else {
        return createJSON({ success: false, message: "Error sending email." });
      }
    }

    return createJSON({ success: false, message: "Unknown action" });

  } catch (error) {
    return createJSON({ valid: false, message: "Server Error: " + error.toString() });
  }
}

/**
 * AUTOMATED EXPIRY REMINDERS
 */
function SEND_EXPIRY_REMINDERS() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("Licenses");
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  const now = new Date();
  
  for (let i = 1; i < data.length; i++) {
    const [email, key, active, createdAt, expiryDate] = data[i];
    if (!(active === true || String(active).toUpperCase() === "TRUE")) continue;
    if (!expiryDate) continue;

    const exp = new Date(expiryDate);
    const timeDiff = exp.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const reminderDays = [7, 5, 3, 1];
    
    if (reminderDays.includes(daysRemaining)) {
      sendEmailViaResend(
        email,
        `Action Required: Your Lumina Pro License Expires in ${daysRemaining} Days! ⏳`,
        `Hi there,<br><br>Your Lumina Pro license (<b>${key}</b>) expires soon.<br><br>Thank you,<br>Harsh Raj Singh`
      );
    }
  }
}

/**
 * Sends email using Resend API
 */
function sendEmailViaResend(to, subject, htmlContent) {
  if (RESEND_API_KEY === "REPLACE_WITH_RESEND_API_KEY") return false;
  const url = "https://api.resend.com/emails";
  const options = {
    method: "post",
    headers: { "Authorization": "Bearer " + RESEND_API_KEY, "Content-Type": "application/json" },
    payload: JSON.stringify({
      from: "Lumina Pro <" + FROM_EMAIL + ">",
      to: [to], bcc: [ADMIN_EMAIL],
      subject: subject, html: htmlContent
    }),
    muteHttpExceptions: true
  };
  try {
    const response = UrlFetchApp.fetch(url, options);
    return response.getResponseCode() < 300;
  } catch (e) { return false; }
}

function createJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

// Manual Admin Tool
function MANUALLY_ISSUE_KEY() {
  const email = "USER_EMAIL_HERE";
  if (email === "USER_EMAIL_HERE") return;
  const key = "LUMINA-" + Utilities.getUuid().slice(0, 12).toUpperCase();
  const now = new Date();
  const expiry = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  if (sendEmailViaResend(email, "Your Lumina License", "Key: " + key)) {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Licenses");
    sheet.appendRow([email, key, true, now, expiry, "SENT_MANUAL", "YES"]);
  }
}

