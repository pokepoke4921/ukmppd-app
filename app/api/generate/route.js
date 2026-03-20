import Anthropic from "@anthropic-ai/sdk";

export async function POST(req) {
  try {
    const { pdfBase64, prompt } = await req.json();

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: pdfBase64,
              },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    });

    return Response.json({ content: response.content });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
