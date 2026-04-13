import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET' && req.url?.includes('/api/health')) {
    return res.json({
      status: "ok",
      aiConfigured: !!(process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  }

  if (req.method === 'POST' && req.url?.includes('/api/ocr')) {
    try {
      if (!(process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY)) {
        return res.status(500).json({ error: "AI service not configured" });
      }

      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ error: "Image data is required" });
      }

      const imageUrl = image.startsWith('data:') ? image : `data:image/jpeg;base64,\${image}`;

      const prompt = `Analyze this image and extract ONLY Chinese characters/words. This may be an annotated spelling list with English translations - ignore all English text completely.

For each Chinese word/character found, provide:
1. The Chinese character(s) only - no English, no pinyin from the image
2. The pinyin pronunciation with tone marks (generate this yourself)
3. The English definition/meaning (generate this yourself)

Return ONLY a valid JSON array with this exact structure (no markdown, no code blocks, just the raw JSON):
[
  {
    "character": "中文字符",
    "pinyin": "pīnyīn",
    "definition": "English meaning"
  }
]

Critical rules:
- You MUST use Simplified Chinese characters ONLY.
- NEVER use Japanese kanji or Traditional Chinese variants.
- ONLY extract Chinese characters - completely ignore any English text visible in the image.
- Use proper pinyin tone marks.
- Provide clear, concise English definitions.
- If no Chinese characters are found, return an empty array: []`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        max_tokens: 4096,
      });

      const text = (response as any).choices?.?.message?.content || "";

      let jsonStr = text.trim();
      if (jsonStr.startsWith("```json")) jsonStr = jsonStr.slice(7);
      else if (jsonStr.startsWith("```")) jsonStr = jsonStr.slice(3);
      if (jsonStr.endsWith("```")) jsonStr = jsonStr.slice(0, -3);
      jsonStr = jsonStr.trim();

      let characters: any[] = [];
      try {
        characters = JSON.parse(jsonStr);
        if (!Array.isArray(characters)) characters = [];
      } catch {
        characters = [];
      }

      return res.json({ characters });
    } catch (error: any) {
      console.error("OCR error:", error?.message || error);
      return res.status(500).json({
        error: "Failed to process image",
        details: error?.message || "Unknown error",
      });
    }
  }

  if (req.method === 'POST' && req.url?.includes('/api/define')) {
    try {
      if (!(process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY)) {
        return res.status(500).json({ error: "AI service not configured" });
      }

      const { character, context } = req.body;
      if (!character) {
        return res.status(400).json({ error: "Character is required" });
      }

      const contextPrompt = context
        ? `The character "\${character}" appears in the word "\${context}".`
        : `The character is "\${character}".`;

      const prompt = `\${contextPrompt}

Provide a detailed breakdown of this single Simplified Chinese character. Return ONLY valid JSON (no markdown, no code blocks):
{
  "character": "\${character}",
  "pinyin": "pinyin with tone mark",
  "definition": "primary English meaning",
  "details": "2-3 sentence explanation",
  "examples": [
    { "word": "example word", "pinyin": "pinyin", "meaning": "meaning" },
    { "word": "example word", "pinyin": "pinyin", "meaning": "meaning" }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1024,
      });

      const text = (response as any).choices?.?.message?.content || "";
      let jsonStr = text.trim();
      if (jsonStr.startsWith("```json")) jsonStr = jsonStr.slice(7);
      else if (jsonStr.startsWith("```")) jsonStr = jsonStr.slice(3);
      if (jsonStr.endsWith("```")) jsonStr = jsonStr.slice(0, -3);
      jsonStr = jsonStr.trim();

      const result = JSON.parse(jsonStr);
      return res.json(result);
    } catch (error: any) {
      console.error("Define error:", error?.message || error);
      return res.status(500).json({ error: "Failed to look up character" });
    }
  }

  return res.status(404).json({ error: "Not found" });
}
