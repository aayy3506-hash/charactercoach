import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CharacterData, HistorySession } from '../types';

interface SettingsState {
  pauseDuration: number;
  speechRate: number;
  autoPlay: boolean;
  showPinyin: boolean;
  showDefinitions: boolean;
  repeatCount: number;
  autoAdvanceEnabled: boolean;
  shuffleEnabled: boolean;
  setPauseDuration: (value: number) => void;
  setSpeechRate: (value: number) => void;
  setAutoPlay: (value: boolean) => void;
  setShowPinyin: (value: boolean) => void;
  setShowDefinitions: (value: boolean) => void;
  setRepeatCount: (value: number) => void;
  setAutoAdvanceEnabled: (value: boolean) => void;
  setShuffleEnabled: (value: boolean) => void;
}

interface HistoryState {
  sessions: HistorySession[];
  loadSessions: () => void;
  saveSession: (characters: CharacterData[], name: string, imageUrl?: string, isShuffled?: boolean) => void;
  updateSessionName: (id: string, name: string) => void;
  deleteSession: (id: string) => void;
  clearHistory: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      pauseDuration: 3,
      speechRate: 1.0,
      autoPlay: false,
      showPinyin: true,
      showDefinitions: true,
      repeatCount: 2,
      autoAdvanceEnabled: false,
      shuffleEnabled: false,
      setPauseDuration: (value) => set({ pauseDuration: value }),
      setSpeechRate: (value) => set({ speechRate: value }),
      setAutoPlay: (value) => set({ autoPlay: value }),
      setShowPinyin: (value) => set({ showPinyin: value }),
      setShowDefinitions: (value) => set({ showDefinitions: value }),
      setRepeatCount: (value) => set({ repeatCount: value }),
      setAutoAdvanceEnabled: (value) => set({ autoAdvanceEnabled: value }),
      setShuffleEnabled: (value) => set({ shuffleEnabled: value }),
    }),
    {
      name: 'hanzi-settings',
    }
  )
);

const HISTORY_KEY = 'hanzi-history';

export const useHistoryStore = create<HistoryState>((set, get) => ({
  sessions: [],

  loadSessions: () => {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        let sessions: HistorySession[];
        
        if (Array.isArray(parsed)) {
          sessions = parsed;
        } else if (parsed?.state?.sessions && Array.isArray(parsed.state.sessions)) {
          sessions = parsed.state.sessions;
        } else {
          sessions = [];
        }
        
        const migratedSessions = sessions.map((s) => ({
          ...s,
          name: s.name || `Session ${new Date(s.createdAt).toLocaleDateString()}`,
        }));
        set({
          sessions: migratedSessions.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),
        });
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  },

  saveSession: (characters, name, imageUrl, isShuffled = false) => {
    try {
      const newSession: HistorySession = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name,
        characters,
        imageUrl,
        createdAt: new Date().toISOString(),
        isShuffled,
      };
      const currentSessions = get().sessions;
      const updatedSessions = [newSession, ...currentSessions].slice(0, 50);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedSessions));
      set({ sessions: updatedSessions });
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  },

  updateSessionName: (id, name) => {
    try {
      const currentSessions = get().sessions;
      const updatedSessions = currentSessions.map((s) => (s.id === id ? { ...s, name } : s));
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedSessions));
      set({ sessions: updatedSessions });
    } catch (error) {
      console.error('Failed to update session name:', error);
    }
  },

  deleteSession: (id) => {
    try {
      const currentSessions = get().sessions;
      const updatedSessions = currentSessions.filter((s) => s.id !== id);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedSessions));
      set({ sessions: updatedSessions });
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  },

  clearHistory: () => {
    try {
      localStorage.removeItem(HISTORY_KEY);
      set({ sessions: [] });
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  },
}));
