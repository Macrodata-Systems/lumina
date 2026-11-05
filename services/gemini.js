/**
 * Lumina - AI Copilot for the Web
 * Copyright (c) 2026 Harsh Raj Singh. All Rights Reserved.
 * Proprietary and Confidential.
 */


// Diagnostic helper
async function listAvailableModels(apiKey) {
  try {
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!resp.ok) return 'Could not list models.';
    const data = await resp.json();
    // Filter for generateContent support
    const models = data.models
      .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
      .map(m => m.name.replace('models/', ''))
      .slice(0, 5); // Just first 5
    return 'Available: ' + models.join(', ');
  } catch (e) {
    return 'Discovery failed.';
  }
}

// Hardcoded backup keys provided by user
const BACKUP_KEYS = [
  "AIzaSyB8za6WvR46JvYJXYoo94ywtYA6aHENmuE",
  "AIzaSyDF3u6ZqRnyqpe-hFAiJVIOqu3f9-XK7oY",
  "AIzaSyCDKTFpEjR9jdvnfPAZQx4EflUyvhxOnEc",
  "AIzaSyCCwPy02jp9BSJoY0JSu0VD0__UKlLgB8I",
  "AIzaSyD7dt0-vnGzVmU2TH_wNdnVLwkp2t6Jweo",
  "AIzaSyDTS44EjgPJlI6GHc4ndj7aVIFbaCeygPc",
  "AIzaSyCCImqvUq4xpNA5HDLhz7T1KpSwP0kaRCs",
  "AIzaSyDyRuDP-ymQHxPK-7yAASPLyDJU14aksXI",
  "AIzaSyBxC9zMcJpy_Q76oVafEt1TdNjS3n7QcJ0"
];

let currentBackupIndex = 0;

export async function callGemini(apiKey, base64Image, prompt = "explain", conversationHistory = null) {
  // Start with the user's provided key from local storage
  let currentKeyToTry = apiKey;
  let attempts = 0;
  const maxAttempts = BACKUP_KEYS.length + 1; // Primary + All Backups

  const modelName = 'gemini-2.5-flash';

  // Prepare payload once
  let contents;
  if (conversationHistory && conversationHistory.length > 0) {
    contents = conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));
    const currentParts = [{ text: prompt }];
    if (base64Image) {
      if (Array.isArray(base64Image)) {
        base64Image.forEach(img => {
          if (img) currentParts.push({ inline_data: { mime_type: "image/jpeg", data: img.split(',')[1] } });
        });
      } else {
        currentParts.push({ inline_data: { mime_type: "image/jpeg", data: base64Image.split(',')[1] } });
      }
    }
    contents.push({ role: 'user', parts: currentParts });
  } else {
    const parts = [{ text: prompt }];
    if (base64Image) {
      if (Array.isArray(base64Image)) {
        base64Image.forEach(img => {
          if (img) parts.push({ inline_data: { mime_type: "image/jpeg", data: img.split(',')[1] } });
        });
      } else {
        parts.push({ inline_data: { mime_type: "image/jpeg", data: base64Image.split(',')[1] } });
      }
    }
    contents = [{ role: 'user', parts: parts }];
  }
  const payload = { contents: contents };

  // Retry loop
  while (attempts < maxAttempts) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${currentKeyToTry}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const initialError = errorData.error?.message || 'Gemini API Error';
        const status = response.status;

        if (status === 429 || initialError.includes('RESOURCE_EXHAUSTED')) {
          console.warn(`[Lumina] Gemini Quota Exceeded for key ending in ...${currentKeyToTry.slice(-4)}. Rotating...`);

          attempts++;
          if (attempts >= maxAttempts) {
            throw new Error('Quota Exceeded on all available fallback keys.');
          }

          // Switch to next backup key and retry immediately
          currentKeyToTry = BACKUP_KEYS[currentBackupIndex];
          currentBackupIndex = (currentBackupIndex + 1) % BACKUP_KEYS.length;
          continue;
        }

        if (status === 400 && initialError.includes('API_KEY_INVALID')) {
          throw new Error('Invalid API Key');
        }

        if (initialError.includes('not found') || initialError.includes('not supported')) {
          const available = await listAvailableModels(currentKeyToTry);
          throw new Error(`${initialError} \n[DEBUG] ${available}`);
        }

        throw new Error(`Gemini Error (${status}): ${initialError}`);
      }

      const data = await response.json();

      // Check if Gemini blocked the request for safety reasons
      if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
        const blockReason = data.promptFeedback?.blockReason || data.candidates?.[0]?.finishReason || "Unknown API response format";
        throw new Error(`Gemini blocked the request: ${blockReason}`);
      }

      // If a backup key succeeded, update local storage so the user doesn't hit the bad key again next time
      if (currentKeyToTry !== apiKey) {
        console.log(`[Lumina] Successfully used backup key ending in ...${currentKeyToTry.slice(-4)}. Updating local storage.`);
        chrome.storage.local.set({ geminiKey: currentKeyToTry });
        chrome.storage.sync.set({ geminiKey: currentKeyToTry });
      }

      return data.candidates[0].content.parts[0].text;

    } catch (error) {
      // Only rethrow if it's a hard failure or we've exhausted all retries
      if (error.message.includes('Quota Exceeded on all') || error.message !== 'Quota Exceeded') {
        throw error;
      }
    }
  }
}

/**
 * Extracts all text from a generic file (PDF, Image, etc.) using Gemini 2.5
 */
export async function extractTextFromDocument(apiKey, base64Data, mimeType) {
  const modelName = 'gemini-2.5-flash';
  let currentKeyToTry = apiKey;
  let attempts = 0;
  const maxAttempts = BACKUP_KEYS.length + 1;

  const prompt = "Please thoroughly analyze this document/image and extract ALL text exactly as it appears. Do not summarize or provide conversational filler. Only return the raw text extracted from the file.";

  const payload = {
    contents: [{
      parts: [
        { text: prompt },
        {
          inline_data: {
            mime_type: mimeType,
            data: base64Data.split(',')[1] || base64Data
          }
        }
      ]
    }]
  };

  while (attempts < maxAttempts) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${currentKeyToTry}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const initialError = errorData.error?.message || 'Gemini API Error';
        const status = response.status;

        if (status === 429 || initialError.includes('RESOURCE_EXHAUSTED')) {
          attempts++;
          if (attempts >= maxAttempts) throw new Error('Quota Exceeded on all available fallback keys.');
          currentKeyToTry = BACKUP_KEYS[currentBackupIndex];
          currentBackupIndex = (currentBackupIndex + 1) % BACKUP_KEYS.length;
          continue;
        }
        throw new Error(`Gemini Error (${status}): ${initialError}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;

    } catch (error) {
      if (error.message.includes('Quota Exceeded on all') || !error.message.includes('Quota Exceeded')) {
        throw error;
      }
    }
  }
}
