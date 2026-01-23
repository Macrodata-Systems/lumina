export async function callOpenAI(apiKey, base64Image, prompt = "explain") {
    const url = 'https://api.openai.com/v1/chat/completions';
    
    const content = [{ type: "text", text: prompt }];
    
    if (base64Image) {
        content.push({
            type: "image_url",
            image_url: {
                url: base64Image
            }
        });
    }

    const payload = {
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: content
        }
      ],
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
      throw new Error(errorData.error?.message || 'OpenAI API Error');
    }
  
    const data = await response.json();
    return data.choices[0].message.content;
  }
