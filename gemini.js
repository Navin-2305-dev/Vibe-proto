export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing GEMINI_API_KEY' });
  }

  const { modelId, body } = req.body || {};
  if (!modelId || !body) {
    return res.status(400).json({ error: 'Missing modelId or body' });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const rawText = await response.text();
    let data;
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      data = { error: rawText || 'Invalid JSON response from Gemini API' };
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || data?.error || 'Gemini API request failed',
        details: rawText
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
}

// Made with Bob
