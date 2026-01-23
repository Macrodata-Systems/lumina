
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

export async function callGemini(apiKey, base64Image, prompt = "explain") {
  // Debug log confirms 1.5 is unavailable. Using 2.5-flash which IS available.
  const modelName = 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const parts = [{ text: prompt }];

  if (base64Image) {
    const base64Data = base64Image.split(',')[1];
    parts.push({
      inline_data: {
        mime_type: "image/jpeg",
        data: base64Data
      }
    });
  }

  const payload = {
    contents: [{
      parts: parts
    }]
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json();
    const initialError = errorData.error?.message || 'Gemini API Error';

    const status = response.status;

    if (status === 400 && initialError.includes('API_KEY_INVALID')) {
      throw new Error('⚠️ <strong>Invalid API Key</strong><br>Please check your settings.');
    }
    if (status === 429 || initialError.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('⚠️ <strong>Quota Exceeded</strong><br>You hit the free tier limit. Please wait.');
    }

    // If model not found, try to find what IS available
    if (initialError.includes('not found') || initialError.includes('not supported')) {
      const available = await listAvailableModels(apiKey);
      throw new Error(`${initialError} \n[DEBUG] ${available}`);
    }

    throw new Error(`Gemini Error (${status}): ${initialError}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}
