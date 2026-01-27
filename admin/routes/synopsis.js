import { Router } from 'express';

const router = Router();

// Generate synopsis using Ollama (llama3)
router.post('/', async (req, res) => {
  const { title, body } = req.body;
  if (!title && !body) {
    return res.status(400).json({ error: 'Title or body content is required' });
  }

  try {
    const content = `Title: ${title || 'Untitled'}\n\nContent:\n${body || '(no content yet)'}`;
    const prompt = `Summarize this blog post in exactly 3 sentences.\n\n${content}\n\nRespond with ONLY the 3 summary sentences. Do not include any preamble like "Here are" or "Here's" or "The following". Start directly with the first sentence of the summary:`;

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3',
        prompt: prompt,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}`);
    }

    const data = await response.json();
    const synopsis = data.response.trim();
    res.json({ success: true, synopsis });
  } catch (err) {
    console.error('Ollama API error:', err);
    res.status(500).json({ error: 'Failed to generate synopsis: ' + err.message });
  }
});

export default router;
