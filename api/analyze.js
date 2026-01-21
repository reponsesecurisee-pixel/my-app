export default async function handler(req, res) {
  // Разрешаем только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, systemContext } = req.body;

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Можно заменить на 'gpt-4o-mini' для экономии
        messages: [
          { 
            role: 'system', 
            content: systemContext || 'You are a helpful assistant. Output JSON.' 
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" }, // Гарантирует JSON формат
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const content = data.choices[0].message.content;
    return res.status(200).json({ result: content });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Error processing request', details: error.message });
  }
}
