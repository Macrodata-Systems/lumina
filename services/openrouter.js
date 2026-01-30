export async function callOpenRouter(apiKey, imageData, prompt, history) {
    const messages = [];

    // Convert history to OpenRouter format
    if (history && history.length > 0) {
        history.forEach(item => {
            messages.push({ role: item.role, content: item.content });
        });
    }

    // Current message with optional image
    let content = [{ type: "text", text: prompt }];
    if (imageData) {
        content.push({
            type: "image_url",
            image_url: {
                url: imageData
            }
        });
    }
    messages.push({ role: "user", content: content });

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://lumina-extension.com", // Optional, for OpenRouter rankings
                "X-Title": "Lumina AI"
            },
            body: JSON.stringify({
                "model": "mistralai/mistral-7b-instruct:free", // Reliable non-Google fallback
                "messages": messages.map(m => {
                    // Filter out image_url content for text-only model to prevent provider errors
                    if (Array.isArray(m.content)) {
                        return {
                            role: m.role,
                            content: m.content.filter(c => c.type === 'text').map(c => c.text).join('\n')
                        };
                    }
                    return m;
                })
            })
        });

        const data = await response.json();
        if (data.error) {
            throw new Error(data.error.message || "OpenRouter Error");
        }
        return data.choices[0].message.content;
    } catch (err) {
        console.error("OpenRouter Error:", err);
        throw err;
    }
}
