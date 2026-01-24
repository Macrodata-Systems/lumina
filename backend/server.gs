// Google Apps Script - Lumina Backend v5 (Expiry Reminders)

// CONFIGURATION
const SHEET_ID = "REPLACE_WITH_YOUR_SHEET_ID";
const ADMIN_EMAIL = "singhharsh199@gmail.com";
const RESEND_API_KEY = "REPLACE_WITH_RESEND_API_KEY"; 
const FROM_EMAIL = "noreply@lumina-ai.com";

/**
 * Handle incoming POST requests from the extension.
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action || "verify";

    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName("Licenses");
    if (!sheet) return createJSON({ valid: false, message: "Database Error: sheet 'Licenses' not found." });

    // --- ACTION: VERIFY ---
    if (action === "verify") {
      const keyToCheck = data.licenseKey;
      if (!keyToCheck) return createJSON({ valid: false, message: "No key provided" });

      const rows = sheet.getDataRange().getValues();
      const now = new Date();

      for (let i = 1; i < rows.length; i++) {
        const [email, key, active, createdAt, expiryDate] = rows[i];
        
        if (String(key).trim() === String(keyToCheck).trim()) {
          // 1. Check if manually deactivated
          if (!(active === true || String(active).toUpperCase() === "TRUE")) {
             return createJSON({ valid: false, message: "License Revoked" });
          }

          // 2. Check Expiry (AUTO-FLAG)
          if (expiryDate) {
            const exp = new Date(expiryDate);
            if (now > exp) {
               return createJSON({ valid: false, message: "License Expired. Renew at Lumina-ai.com" });
            }
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

      // 1. Prevent duplicate active keys for same email
      const dataRange = sheet.getDataRange().getValues();
      for (let i = 1; i < dataRange.length; i++) {
        const [mail, key, active] = dataRange[i];
        if (mail.toLowerCase() === userEmail && (active === true || String(active).toUpperCase() === "TRUE")) {
          return createJSON({ success: false, message: "An active key already exists for this email." });
        }
      }

      // 2. Generate key
      const key = "LUMINA-" + Utilities.getUuid().slice(0, 12).toUpperCase();

      // 3. Calculate Expiry (1 Year from Now)
      const now = new Date();
      const expiry = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

      // 4. Email via Resend
      const emailSent = sendEmailViaResend(
        userEmail,
        "Your Lumina Pro License Key 🚀",
        `Hi there,<br><br>Thanks for choosing Lumina Pro!<br><br>Your Annual License Key: <b>${key}</b><br>Expiry Date: <b>${expiry.toLocaleDateString()}</b><br><br>Instructions:<br>1. Open Lumina extension settings.<br>2. Paste key and click Save.<br><br>Best,<br>Harsh Raj Singh`
      );

      if (emailSent) {
        // 5. LOG TO SHEET
        // Headers: [Email, LicenseKey, Active, CreatedAt, ExpiryDate, Status, PaymentVerified]
        sheet.appendRow([userEmail, key, true, now, expiry, "SENT", "PENDING"]);
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
 * Setup a Daily Trigger for this function in Apps Script.
 */
function SEND_EXPIRY_REMINDERS() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("Licenses");
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  const now = new Date();
  
  for (let i = 1; i < data.length; i++) {
    const [email, key, active, createdAt, expiryDate] = data[i];
    
    // Only check active licenses
    if (!(active === true || String(active).toUpperCase() === "TRUE")) continue;
    if (!expiryDate) continue;

    const exp = new Date(expiryDate);
    const timeDiff = exp.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

    // Logic: 7, 5, 3, 1 days before expiry (alternate days starting week prior)
    const reminderDays = [7, 5, 3, 1];
    
    if (reminderDays.includes(daysRemaining)) {
      sendEmailViaResend(
        email,
        `Action Required: Your Lumina Pro License Expires in ${daysRemaining} Days! ⏳`,
        `Hi there,<br><br>Just a friendly reminder that your Lumina Pro license (<b>${key}</b>) is set to expire on <b>${exp.toLocaleDateString()}</b> (only ${daysRemaining} days left).<br><br>To avoid any interruption in your productivity workflow, please renew your subscription soon.<br><br>Thank you,<br>Harsh Raj Singh`
      );
      Logger.log(`Sent ${daysRemaining}-day reminder to ${email}`);
    }
  }
}

/**
 * Sends email using Resend API (allows custom domain)
 */
function sendEmailViaResend(to, subject, htmlContent) {
  if (RESEND_API_KEY === "REPLACE_WITH_RESEND_API_KEY") return false;

  const url = "https://api.resend.com/emails";
  const options = {
    method: "post",
    headers: {
      "Authorization": "Bearer " + RESEND_API_KEY,
      "Content-Type": "application/json"
    },
    payload: JSON.stringify({
      from: "Lumina Pro <" + FROM_EMAIL + ">",
      to: [to],
      bcc: [ADMIN_EMAIL],
      subject: subject,
      html: htmlContent
    }),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();
    return code === 200 || code === 201;
  } catch (e) {
    Logger.log("Fetch Error: " + e.toString());
    return false;
  }
}

function createJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
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
