export async function callAnthropic(apiKey, base64Image, prompt = "explain") {
  const url = 'https://api.anthropic.com/v1/messages';

  const content = [];

  if (base64Image) {
    const base64Data = base64Image.split(',')[1];
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/jpeg",
        data: base64Data
      }
    });
  }

  content.push({
    type: "text",
    text: prompt
  });

  const payload = {
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: content
      }
    ]
  };

  // Note: 'dangerouslyAllowBrowser' is a client-side SDK thing, for raw fetch we just need correct headers.
  // Anthropic API strictly enforces CORS. It might block requests from extensions.
  // If this fails, we might need to route through a background script or use a proxy.
  // For now, we attempt direct call.
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      // "dangerously-allow-browser": "true" // NOT a header, but a concept. 
      // Extension origin might be allowed or blocked.
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json();
    const msg = errorData.error?.message || 'Unknown Error';
    const status = response.status;

    if (status === 401) throw new Error('⚠️ <strong>Invalid API Key</strong><br>Check settings.');
    if (status === 402) throw new Error('⚠️ <strong>Insufficient Credits</strong><br>Check Anthropic balance.');
    if (status === 429) throw new Error('⚠️ <strong>Rate Limit</strong><br>Too many requests.');

    throw new Error(`Claude Error (${status}): ${msg}`);
  }

  const data = await response.json();
  return data.content[0].text;
}
