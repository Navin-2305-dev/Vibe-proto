export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[gemini.js] Missing GEMINI_API_KEY');
    return res.status(500).json({ error: 'Missing GEMINI_API_KEY' });
  }

  const { modelId, body } = req.body || {};
  console.log('[gemini.js] Incoming request', {
    modelId,
    hasBody: !!body,
    bodyKeys: body ? Object.keys(body) : [],
    apiKeyLength: apiKey.length
  });

  if (!modelId || !body) {
    return res.status(400).json({ error: 'Missing modelId or body' });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(apiKey)}`;
    console.log('[gemini.js] Upstream request', {
      urlPreview: url.replace(apiKey, '***redacted***'),
      bodyPreview: JSON.stringify(body).slice(0, 500)
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const rawText = await response.text();
    console.log('[gemini.js] Upstream response', {
      ok: response.ok,
      status: response.status,
      rawPreview: rawText.slice(0, 1000)
    });

    let data;
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch (parseError) {
      console.error('[gemini.js] JSON parse failed', parseError);
      data = { error: rawText || 'Invalid JSON response from Gemini API' };
    }

    if (!response.ok) {
      console.error('[gemini.js] Upstream API error', data);
      return res.status(response.status).json({
        error: data?.error?.message || data?.error || 'Gemini API request failed',
        details: rawText
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('[gemini.js] Handler error', error);
    return res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
}

// Made with Bob
