export async function callDeepSeek(apiKey, screenshotUrl, promptText) {
  const deepseekEndpoint = 'https://api.deepseek.com/chat/completions';

  // DeepSeek V3 is primarily text-based. Ignoring screenshotUrl for now to avoid errors.
  // Appending a note if a screenshot was essentially ignored?
  // Actually, we'll just send the text prompt which already includes page text.

  const payload = {
    model: "deepseek-chat",
    messages: [
      {
        role: "system",
        content: "You are a helpful AI assistant. You are analyzing web page content provided by the user."
      },
      {
        role: "user",
        content: promptText
      }
    ],
    temperature: 0.7
  };

  try {
    const response = await fetch(deepseekEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    console.error("DeepSeek API Error:", error);
    throw error;
  }
}
