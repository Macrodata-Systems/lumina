export async function callGroq(apiKey, imageData, prompt, history) {
    const messages = [];

    // Convert history to Groq format
    if (history && history.length > 0) {
        history.forEach(item => {
            messages.push({ role: item.role, content: item.content });
        });
    }

    // Groq currently has limited support for image input in some models,
    // so we'll handle text-only if no image, or vision model if image.
    const model = imageData ? "llama-3.2-11b-vision-preview" : "llama-3.3-70b-versatile";

    // Current message
    if (imageData) {
        messages.push({
            role: "user",
            content: [
                { type: "text", text: prompt },
                {
                    type: "image_url",
                    image_url: {
                        url: imageData
                    }
                }
            ]
        });
    } else {
        messages.push({ role: "user", content: prompt });
    }

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": model,
                "messages": messages
            })
        });

        const data = await response.json();
        if (data.error) {
            throw new Error(data.error.message || "Groq Error");
        }
        return data.choices[0].message.content;
    } catch (err) {
        console.error("Groq Error:", err);
        throw err;
    }
}
