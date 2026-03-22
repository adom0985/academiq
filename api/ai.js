export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'});

  const { model, prompt, system, messages } = req.body;

  try {
    if (model === 'claude') {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': req.body.key,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          system: system || 'أنت مدرس ذكي.',
          messages: messages || [{role:'user',content:prompt}]
        })
      });
      const d = await r.json();
      return res.json({text: d.content?.[0]?.text || 'لا يوجد رد.'});
    }

    if (model === 'gemini') {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${req.body.key}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({contents:[{parts:[{text:(system?system+'\n\n':'')+prompt}]}]})
      });
      const d = await r.json();
      return res.json({text: d.candidates?.[0]?.content?.parts?.[0]?.text || 'لا يوجد رد.'});
    }

    if (model === 'openai') {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {'Content-Type':'application/json','Authorization':'Bearer '+req.body.key},
        body: JSON.stringify({
          model: 'gpt-4o-mini', max_tokens: 1500,
          messages: [{role:'system',content:system||'أنت مدرس ذكي.'},{role:'user',content:prompt}]
        })
      });
      const d = await r.json();
      return res.json({text: d.choices?.[0]?.message?.content || 'لا يوجد رد.'});
    }

    if (model === 'grok') {
      const r = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {'Content-Type':'application/json','Authorization':'Bearer '+req.body.key},
        body: JSON.stringify({
          model: 'grok-beta', max_tokens: 1500,
          messages: [{role:'system',content:system||'أنت مدرس ذكي.'},{role:'user',content:prompt}]
        })
      });
      const d = await r.json();
      return res.json({text: d.choices?.[0]?.message?.content || 'لا يوجد رد.'});
    }

    return res.json({text: 'نموذج غير معروف.'});
  } catch(e) {
    return res.status(500).json({text: '⚠️ خطأ: ' + e.message});
  }
}
