import express from "express";
import OpenAI from "openai";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

interface CharacterData {
  character: string;
  pinyin: string;
  definition: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    aiConfigured: !!(process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/ocr", async (req, res) => {
  try {
    if (!(process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY)) {
      console.error("AI API key not configured");
      return res.status(500).json({ error: "AI service not configured" });
    }

    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Image data is required" });
    }

    console.log(`Processing image, size: \${image.length} characters`);

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
- You MUST use Simplified Chinese characters (简体中文) ONLY. NEVER use Traditional Chinese or Japanese kanji variants.
- NEVER use Japanese kanji. Many Japanese kanji look similar to Chinese characters but are different glyphs. Always use the standard Simplified Chinese (GB2312/GB18030) version of each character.
- For example: use 确 (Simplified Chinese) NOT 確 (Traditional/Japanese). Use 认 NOT 認. Use 说 NOT 說. Use 学 NOT 學. Use 马 NOT 馬.
- If you are uncertain about a character from the image, cross-reference it with the standard Simplified Chinese form and output the Simplified Chinese version.
- ONLY extract Chinese characters - completely ignore any English text, annotations, labels, or translations visible in the image
- Do NOT include English words, pinyin written in the image, or any non-Chinese text in the "character" field
- The "character" field must contain ONLY Simplified Chinese characters (简体汉字)
- Extract compound words as they appear if they form meaningful words
- Use proper pinyin tone marks (ā, á, ǎ, à, ē, é, ě, è, etc.)
- Provide clear, concise English definitions
- If you see a vocabulary list, extract each Chinese word as a separate entry
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
  image_url: {
    url: image.startsWith('data:') ? image : `data:image/jpeg;base64,\${image}`,
  },
},
          ],
        },
      ],
      max_tokens: 4096,
    });

    const text = (response.choices as any)?.message?.content || "";

    let jsonStr = text.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith("```")) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    let characters: CharacterData[] = [];
    try {
      characters = JSON.parse(jsonStr);
      if (!Array.isArray(characters)) {
        characters = [];
      }
    } catch (parseError) {
      console.error("Failed to parse OCR response:", parseError);
      console.log("Raw response:", text);
      characters = [];
    }

    res.json({ characters });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("OCR error:", errorMessage);
    res.status(500).json({
      error: "Failed to process image",
      details: errorMessage,
    });
  }
});

app.post("/api/define", async (req, res) => {
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
  "details": "2-3 sentence explanation of this character's meaning, common usage, and any helpful memory aids",
  "examples": [
    { "word": "a common 2-character word using this character", "pinyin": "pinyin", "meaning": "English meaning" },
    { "word": "another common word using this character", "pinyin": "pinyin", "meaning": "English meaning" }
  ]
}

Rules:
- Use Simplified Chinese characters (简体中文) ONLY. Never use Japanese kanji or Traditional Chinese variants.
- Provide exactly 2 example words that use this character.
- Keep the details concise but informative.
- Use proper pinyin tone marks.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1024,
    });

    const text = (response.choices as any)?.message?.content || "";
    let jsonStr = text.trim();
    if (jsonStr.startsWith("```json")) jsonStr = jsonStr.slice(7);
    else if (jsonStr.startsWith("```")) jsonStr = jsonStr.slice(3);
    if (jsonStr.endsWith("```")) jsonStr = jsonStr.slice(0, -3);
    jsonStr = jsonStr.trim();

    const result = JSON.parse(jsonStr);
    res.json(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Define error:", errorMessage);
    res.status(500).json({ error: "Failed to look up character" });
  }
});

export default app;
