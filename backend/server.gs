// Google Apps Script - Lumina Backend v8.5 (VERBOSE DEBUG)
const SCRIPT_VERSION = "v8.5-DEBUG";

// CONFIGURATION
const SHEET_ID = "15wV71ItpuyYQAhFAxaLMDuH4YZPLZisogvvFh-PIAlg";
const ADMIN_EMAIL = "singhharsh199@gmail.com";
const RESEND_API_KEY = "REPLACE_WITH_RESEND_API_KEY"; 
const FROM_EMAIL = "noreply@lumina-ai.com";

// --- GLOBAL BETA SETTINGS ---
const GLOBAL_BETA_ACTIVE = true; // Set to false after 6 months
const BETA_MESSAGE = "Early Bird Beta Active - Enjoy Pro features for free!";

// --- SECURE PROXY KEYS (DO NOT SHARE THESE) ---
// Note: Only Gemini is implemented as a free proxy for now.
const PROXY_KEYS = {
  gemini: "AIzaSyAcexnrUQNvLfBJi03SH5OJG48Q1IwljII",
  openai: "REPLACE_WITH_YOUR_OPENAI_KEY" // Optional
};

/**
 * Handle incoming POST requests from the extension.
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action || "verify";

    // --- PRIORITY 1: SECURE AI PROXY (Works without Spreadsheet) ---
    if (action === "proxy_ai") {
      const service = data.service || "gemini";
      const prompt = data.prompt;
      const imageUrl = data.imageUrl; // Optional base64

      if (service === "gemini") {
        const response = callGeminiGAS(PROXY_KEYS.gemini, prompt, imageUrl);
        return createJSON({ success: true, text: response });
      }

      if (service === "openai") {
        if (PROXY_KEYS.openai.includes("REPLACE")) {
          return createJSON({ success: false, error: "OpenAI proxy key not configured." });
        }
        const response = callOpenAIGAS(PROXY_KEYS.openai, prompt, imageUrl);
        return createJSON({ success: true, text: response });
      }

      return createJSON({ success: false, error: "Service not supported via proxy." });
    }

    // --- PRIORITY 2: DATABASE ACTIONS (Requires valid Spreadsheet) ---
    if (SHEET_ID.includes("REPLACE")) {
      return createJSON({ valid: false, message: "Server initialized for Proxy Only (No Database)." });
    }

    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName("Licenses");
    if (!sheet) return createJSON({ valid: false, message: "Database Error: 'Licenses' sheet not found." });

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

    // --- ACTION: PROXY_AI (Secure Key Guard) ---
    if (action === "proxy_ai") {
      const service = data.service || "gemini";
      const prompt = data.prompt;
      const imageUrl = data.imageUrl; // Optional base64

      if (service === "gemini") {
        if (PROXY_KEYS.gemini === "REPLACE_WITH_YOUR_GEMINI_KEY") {
          return createJSON({ success: false, error: "Backend proxy key not configured." });
        }
        const response = callGeminiGAS(PROXY_KEYS.gemini, prompt, imageUrl);
        return createJSON({ success: true, text: response });
      }

      if (service === "openai") {
        if (PROXY_KEYS.openai === "REPLACE_WITH_YOUR_OPENAI_KEY") {
          return createJSON({ success: false, error: "Backend proxy key not configured." });
        }
        const response = callOpenAIGAS(PROXY_KEYS.openai, prompt, imageUrl);
        return createJSON({ success: true, text: response });
      }

      return createJSON({ success: false, error: "Service not supported via proxy." });
    }

    return createJSON({ success: false, error: "Unknown action: " + action });

  } catch (error) {
    return createJSON({ success: false, error: "Server Error: " + error.toString() });
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

/**
 * Helper: Call Gemini from Google Apps Script
 */
function callGeminiGAS(apiKey, prompt, imageUrl) {
  // Configs to try in order (Based on your successful diagnostic)
  const configs = [
    { v: "v1beta", m: "gemini-2.0-flash" },
    { v: "v1beta", m: "gemini-flash-latest" }, 
    { v: "v1beta", m: "gemini-2.5-flash" }
  ];

  let errorLog = [];

  for (const coding of configs) {
    try {
      const url = `https://generativelanguage.googleapis.com/${coding.v}/models/${coding.m}:generateContent?key=${apiKey}`;
      
      const parts = [{ text: prompt }];
      if (imageUrl && imageUrl.includes(',')) {
        parts.push({
          inline_data: { mime_type: "image/jpeg", data: imageUrl.split(',')[1] }
        });
      }

      const payload = { contents: [{ parts: parts }] };
      const options = {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };

      const response = UrlFetchApp.fetch(url, options);
      const resultContent = response.getContentText();
      let result;

      try { result = JSON.parse(resultContent); } catch (e) { 
        errorLog.push(`${coding.m}: JSON Parse Failed`);
        continue; 
      }

      if (response.getResponseCode() === 200 && result.candidates && result.candidates[0]) {
        return result.candidates[0].content.parts[0].text;
      }
      
      const msg = result.error ? `${result.error.message} (Code: ${result.error.code})` : "Unknown Error";
      errorLog.push(`${coding.m} [${coding.v}]: ${msg}`);

    } catch (e) {
      errorLog.push(`${coding.m}: ${e.message}`);
    }
  }

  // --- DIAGNOSTIC: List Available Models ---
  try {
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const listResp = UrlFetchApp.fetch(listUrl, { muteHttpExceptions: true });
    const listData = JSON.parse(listResp.getContentText());
    
    if (listData.models) {
      const availableModels = listData.models.map(m => m.name.replace('models/', ''));
      errorLog.push(`\n[DIAGNOSTIC] Available Models for your Key: ${availableModels.join(', ')}`);
    } else {
      errorLog.push(`\n[DIAGNOSTIC] ListModels Failed: ${JSON.stringify(listData)}`);
    }
  } catch (e) {
    errorLog.push(`\n[DIAGNOSTIC] ListModels Exception: ${e.message}`);
  }

  // If all failed
  throw new Error("All AI models failed. " + errorLog.join("\n"));
}

/**
 * Helper: Call OpenAI from Google Apps Script
 */
function callOpenAIGAS(apiKey, prompt, imageUrl) {
  const url = "https://api.openai.com/v1/chat/completions";
  const content = [{ type: "text", text: prompt }];
  
  if (imageUrl) {
    content.push({ type: "image_url", image_url: { url: imageUrl } });
  }

  const payload = {
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: content }]
  };

  const options = {
    method: "post",
    headers: { "Authorization": "Bearer " + apiKey },
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const result = JSON.parse(response.getContentText());
  
  if (response.getResponseCode() !== 200) {
    throw new Error(result.error?.message || "OpenAI Proxy Error");
  }
  
  return result.choices[0].message.content;
}

