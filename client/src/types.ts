export interface CharacterData {
  character: string;
  pinyin: string;
  definition: string;
}

export interface HistorySession {
  id: string;
  name: string;
  characters: CharacterData[];
  imageUrl?: string;
  createdAt: string;
  isShuffled?: boolean;
}
