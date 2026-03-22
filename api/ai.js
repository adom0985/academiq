export const config = { runtime: 'edge' };

export default async function handler(req) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  try {
    const { model, prompt, system } = await req.json();

    const keys = {
      claude: process.env.CLAUDE_KEY,
      gemini: process.env.GEMINI_KEY,
      openai: process.env.OPENAI_KEY,
      grok:   process.env.GROK_KEY,
    };

    const key = keys[model];
    if (!key) {
      return new Response(
        JSON.stringify({ text: `⚠️ مفتاح ${model} غير موجود في الإعدادات` }),
        { headers }
      );
    }

    let text = 'لا يوجد رد.';

    if (model === 'claude') {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          system: system || 'أنت مدرس ذكي.',
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const d = await r.json();
      text = d.content?.[0]?.text || JSON.stringify(d);
    }

    else if (model === 'gemini') {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: (system ? system + '\n\n' : '') + prompt }] }],
          }),
        }
      );
      const d = await r.json();
      text = d.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(d);
    }

    else if (model === 'openai') {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + key,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 1500,
          messages: [
            { role: 'system', content: system || 'أنت مدرس ذكي.' },
            { role: 'user', content: prompt },
          ],
        }),
      });
      const d = await r.json();
      text = d.choices?.[0]?.message?.content || JSON.stringify(d);
    }

    else if (model === 'grok') {
      const r = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + key,
        },
        body: JSON.stringify({
          model: 'grok-beta',
          max_tokens: 1500,
          messages: [
            { role: 'system', content: system || 'أنت مدرس ذكي.' },
            { role: 'user', content: prompt },
          ],
        }),
      });
      const d = await r.json();
      text = d.choices?.[0]?.message?.content || JSON.stringify(d);
    }

    return new Response(JSON.stringify({ text }), { headers });

  } catch (e) {
    return new Response(
      JSON.stringify({ text: '⚠️ خطأ: ' + e.message }),
      { status: 500, headers }
    );
  }
}
