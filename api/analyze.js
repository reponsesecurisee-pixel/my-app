export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;

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
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `
Tu es un détecteur de risque social.
Tu n’aides pas. Tu ne conseilles pas. Tu n’expliques pas.
Tu évalues uniquement la probabilité qu’un message crée un malaise social.

Tu parles avec assurance, sans empathie.
Tu ne rassures jamais.
Tu ne promets aucun résultat.

Ta tâche est de formuler un risque crédible.
`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4
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
    return res.status(500).json({
      error: 'Error processing request',
      details: error.message
    });
  }
}
