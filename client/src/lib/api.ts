import { CharacterData } from '../types';

const API_BASE = '/api';

export async function processImageOCR(imageBase64: string): Promise<CharacterData[]> {
  const response = await fetch(`${API_BASE}/ocr`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image: imageBase64 }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to process image' }));
    throw new Error(error.error || error.details || 'Failed to process image');
  }

  const data = await response.json();
  return data.characters || [];
}

export interface CharacterDefinition {
  character: string;
  pinyin: string;
  definition: string;
  details: string;
  examples: { word: string; pinyin: string; meaning: string }[];
}

const defineCache: Record<string, CharacterDefinition> = {};

export async function defineCharacter(character: string, context?: string): Promise<CharacterDefinition> {
  const cacheKey = `${character}_${context || ''}`;
  if (defineCache[cacheKey]) {
    return defineCache[cacheKey];
  }

  const response = await fetch(`${API_BASE}/define`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ character, context }),
  });

  if (!response.ok) {
    throw new Error('Failed to look up character');
  }

  const data: CharacterDefinition = await response.json();
  defineCache[cacheKey] = data;
  return data;
}
