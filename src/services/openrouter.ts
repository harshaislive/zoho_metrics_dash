const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function generateReport(prompt: string) {
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
      'HTTP-Referer': window.location.origin,
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-r1-zero:free',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate report');
  }

  const data = await response.json();
  return data.choices[0].message.content;
} 