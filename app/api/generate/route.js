export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req) {
  try {
    const { pdfBase64, prompt } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`;
```

    const body = {
      contents: [{
        parts: [
          { inline_data: { mime_type: "application/pdf", data: pdfBase64 } },
          { text: prompt }
        ]
      }],
      generationConfig: { maxOutputTokens: 8192, temperature: 0.4 }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (data.error) {
      return Response.json({ error: data.error.message }, { status: 500 });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return Response.json({ content: [{ type: "text", text }] });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
