import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

export default async function handler(req: any, res: any) {
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

      const imageUrl = image.startsWith('data:') ? image : 'data:image/jpeg;base64,' + image;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this image and extract ONLY Chinese characters/words. For each Chinese word found, provide the character, pinyin with tone marks, and English definition. Return ONLY a valid JSON array: [{\"character\": \"中文\", \"pinyin\": \"zhōngwén\", \"definition\": \"Chinese language\"}]. Use Simplified Chinese only. If no Chinese characters found, return []." },
              {
                type: "image_url",
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        max_tokens: 4096,
      });

      const text = response.choices?.message?.content || "";

      let jsonStr = text.trim();
      if (jsonStr.startsWith("```json")) jsonStr = jsonStr.slice(7);
      else if (jsonStr.startsWith("```")) jsonStr = jsonStr.slice(3);
      if (jsonStr.endsWith("```")) jsonStr = jsonStr.slice(0, -3);
      jsonStr = jsonStr.trim();

      let characters: any[] = [];
      try {
        characters = JSON.parse(jsonStr);
        if (!Array.isArray(characters)) characters = [];
      } catch (e) {
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
        ? 'The character "' + character + '" appears in the word "' + context + '".'
        : 'The character is "' + character + '".';

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: contextPrompt + ' Provide a detailed breakdown. Return ONLY valid JSON: {"character": "X", "pinyin": "pinyin", "definition": "meaning", "details": "explanation", "examples": [{"word": "example", "pinyin": "pinyin", "meaning": "meaning"}, {"word": "example2", "pinyin": "pinyin", "meaning": "meaning"}]}. Use Simplified Chinese only.' }],
        max_tokens: 1024,
      });

      const text = response.choices?.message?.content || "";
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
