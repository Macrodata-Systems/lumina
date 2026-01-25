export async function callGrok(apiKey, base64Image, prompt = "explain", conversationHistory = null) {
    const url = 'https://api.x.ai/v1/chat/completions';

    // Build messages array
    let messages = [];

    if (conversationHistory && conversationHistory.length > 0) {
        // Format conversation history for xAI API (OpenAI compatible)
        messages = conversationHistory.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
        }));

        // Add current prompt
        messages.push({
            role: "user",
            content: prompt
        });
    } else {
        // Single-turn request
        messages = [{
            role: "user",
            content: prompt
        }];

        // Note: If xAI supports vision, we would add the image here. 
        // For now, Grok-2 supports vision, so we can pass it if prompt mentions it.
        if (base64Image) {
            messages[0].content = [
                { type: "text", text: prompt },
                {
                    type: "image_url",
                    image_url: { url: base64Image }
                }
            ];
        }
    }

    const payload = {
        model: "grok-2-vision-1212", // Latest Grok model with vision support
        messages: messages,
        max_tokens: 1000,
        stream: false
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
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData.error?.message || 'Unknown Error';
        const status = response.status;

        if (status === 401) throw new Error('⚠️ <strong>Invalid API Key</strong><br>Check your xAI settings.');
        if (status === 429) throw new Error('⚠️ <strong>Rate Limit</strong><br>Check your xAI usage limits.');
        if (status >= 500) throw new Error('⚠️ <strong>xAI Down</strong><br>Server error.');

        throw new Error(`Grok Error (${status}): ${msg}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}
