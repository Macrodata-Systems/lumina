export async function callDeepSeek(apiKey, screenshotUrl, promptText, onUpdate) {
  const deepseekEndpoint = 'https://api.deepseek.com/chat/completions';

  const payload = {
    model: "deepseek-reasoner",
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
    temperature: 0.7,
    stream: true
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
        let errorMsg = `API Error: ${response.status}`;
        try {
            const errData = await response.json();
            errorMsg = errData.error?.message || errorMsg;
        } catch(e) {}
        throw new Error(errorMsg);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let accumulatedReasoning = "";
    let accumulatedContent = "";
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        // Process SSE lines
        const lines = chunk.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === 'data: [DONE]') continue;
            
            if (trimmed.startsWith('data: ')) {
                try {
                    const jsonStr = trimmed.substring(6);
                    const data = JSON.parse(jsonStr);
                    const delta = data.choices[0]?.delta;
                    
                    if (delta) {
                        if (delta.reasoning_content) {
                            accumulatedReasoning += delta.reasoning_content;
                        }
                        if (delta.content) {
                            accumulatedContent += delta.content;
                        }
                        
                        // Fire callback with current state
                        if (onUpdate) {
                            onUpdate({
                                reasoning: accumulatedReasoning,
                                content: accumulatedContent
                            });
                        }
                    }
                } catch (e) {
                    // console.warn('Error parsing SSE chunk', e);
                }
            }
        }
    }

    // Final return (though callback handles most of it)
    return {
        reasoning: accumulatedReasoning,
        content: accumulatedContent
    };

  } catch (error) {
    console.error("DeepSeek API Error:", error);
    throw error;
  }
}
