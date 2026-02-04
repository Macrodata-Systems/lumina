/**
 * Lumina - AI Copilot for the Web
 * Copyright (c) 2026 Harsh Raj Singh. All Rights Reserved.
 * Proprietary and Confidential.
 */

export async function callOpenAI(apiKey, base64Image, prompt = "explain", conversationHistory = null) {
  const url = 'https://api.openai.com/v1/chat/completions';

  // Build messages array
  let messages = [];

  if (conversationHistory && conversationHistory.length > 0) {
    // Format conversation history for OpenAI API
    messages = conversationHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));

    // Add current prompt
    const content = [{ type: "text", text: prompt }];

    if (base64Image) {
      content.push({
        type: "image_url",
        image_url: {
          url: base64Image
        }
      });
    }

    messages.push({
      role: "user",
      content: content
    });
  } else {
    // Single-turn request (original behavior)
    const content = [{ type: "text", text: prompt }];

    if (base64Image) {
      content.push({
        type: "image_url",
        image_url: {
          url: base64Image
        }
      });
    }

    messages = [{
      role: "user",
      content: content
    }];
  }

  const payload = {
    model: "gpt-4o",
    messages: messages,
    max_tokens: 500
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json();
    const msg = errorData.error?.message || 'Unknown Error';
    const status = response.status;

    if (status === 401) throw new Error('⚠️ <strong>Invalid API Key</strong><br>Check settings.');
    if (status === 429) throw new Error('⚠️ <strong>Rate Limit Exceeded</strong><br>Check OpenAI credits.');
    if (status >= 500) throw new Error('⚠️ <strong>OpenAI Down</strong><br>Server error.');

    throw new Error(`OpenAI Error (${status}): ${msg}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
