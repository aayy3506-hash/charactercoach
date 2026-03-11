import { useState } from 'react';
import { CharacterData } from '../types';
import { processImageOCR } from '../lib/api';
import './ReviewScreen.css';

interface Props {
  characters: CharacterData[];
  imageUrl?: string;
  sessionName: string;
  shuffleWords: boolean;
  onBack: () => void;
  onStartSession: (characters: CharacterData[], sessionName: string, isShuffled: boolean) => void;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function ReviewScreen({
  characters: initialCharacters,
  imageUrl,
  sessionName,
  shuffleWords,
  onBack,
  onStartSession,
}: Props) {
  const [characters, setCharacters] = useState<CharacterData[]>(initialCharacters);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newCharacter, setNewCharacter] = useState('');
  const [newPinyin, setNewPinyin] = useState('');
  const [newDefinition, setNewDefinition] = useState('');
  const [isProcessingRegion, setIsProcessingRegion] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [zoom, setZoom] = useState(1);

  const toggleSelectionMode = () => {
    if (!selectionMode) {
      setZoom(1);
    }
    setSelectionMode(!selectionMode);
  };

  const handleImageClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectionMode || !imageUrl) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsProcessingRegion(true);
    
    try {
      const img = new Image();
      img.src = imageUrl;
      await new Promise((resolve) => { img.onload = resolve; });
      
      const scaleX = img.naturalWidth / rect.width;
      const scaleY = img.naturalHeight / rect.height;
      
      const cropSize = 150;
      const cropX = Math.max(0, Math.min((x * scaleX) - cropSize / 2, img.naturalWidth - cropSize));
      const cropY = Math.max(0, Math.min((y * scaleY) - cropSize / 2, img.naturalHeight - cropSize));
      const width = Math.min(cropSize, img.naturalWidth - cropX);
      const height = Math.min(cropSize, img.naturalHeight - cropY);
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, cropX, cropY, width, height, 0, 0, width, height);
      
      const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      const result = await processImageOCR(base64);
      
      if (result && result.length > 0) {
        const newChars = result.filter(
          (newChar) => !characters.some((c) => c.character === newChar.character)
        );
        if (newChars.length > 0) {
          setCharacters((prev) => [...prev, ...newChars]);
          alert(`Added ${newChars.length} new word(s)`);
        } else {
          alert('The detected words are already in your list.');
        }
      } else {
        alert('Could not detect Chinese characters in that area. Try tapping elsewhere.');
      }
    } catch (error) {
      console.error('Region OCR error:', error);
      alert('Failed to process the selected area.');
    } finally {
      setIsProcessingRegion(false);
      setSelectionMode(false);
    }
  };

  const handleDeleteWord = (index: number) => {
    if (confirm(`Remove "${characters[index].character}" from the list?`)) {
      setCharacters((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleEditWord = (index: number) => {
    const char = characters[index];
    setEditingIndex(index);
    setNewCharacter(char.character);
    setNewPinyin(char.pinyin);
    setNewDefinition(char.definition);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    if (!newCharacter.trim()) {
      alert('Please enter the Chinese character(s)');
      return;
    }
    setCharacters((prev) =>
      prev.map((char, i) =>
        i === editingIndex
          ? {
              character: newCharacter.trim(),
              pinyin: newPinyin.trim() || '—',
              definition: newDefinition.trim() || '—',
            }
          : char
      )
    );
    setShowEditModal(false);
    resetInputs();
  };

  const handleAddWord = () => {
    if (!newCharacter.trim()) {
      alert('Please enter the Chinese character(s)');
      return;
    }
    setCharacters((prev) => [
      ...prev,
      {
        character: newCharacter.trim(),
        pinyin: newPinyin.trim() || '—',
        definition: newDefinition.trim() || '—',
      },
    ]);
    setShowAddModal(false);
    resetInputs();
  };

  const resetInputs = () => {
    setNewCharacter('');
    setNewPinyin('');
    setNewDefinition('');
    setEditingIndex(null);
  };

  const handleFinalise = () => {
    if (characters.length === 0) {
      alert('Please add at least one word to practice.');
      return;
    }
    const finalCharacters = shuffleWords ? shuffleArray(characters) : characters;
    onStartSession(finalCharacters, sessionName, shuffleWords);
  };

  const handleClose = () => {
    if (confirm('Are you sure you want to go back? Your progress will be lost.')) {
      onBack();
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (selectionMode) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.min(Math.max(z * delta, 1), 4));
  };

  return (
    <div className="review-screen">
      <header className="review-header">
        <button className="header-button" onClick={handleClose} data-testid="button-close-review">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <h1 className="header-title">Review Words</h1>
        <button
          className={`header-button ${selectionMode ? 'active' : ''}`}
          onClick={toggleSelectionMode}
          data-testid="button-selection-mode"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="22" y1="12" x2="18" y2="12" />
            <line x1="6" y1="12" x2="2" y2="12" />
            <line x1="12" y1="6" x2="12" y2="2" />
            <line x1="12" y1="22" x2="12" y2="18" />
          </svg>
        </button>
      </header>

      <div className="review-content">
        {imageUrl && (
          <div className="image-section">
            <p className="section-label">
              {selectionMode
                ? 'Tap on a word in the image to detect it'
                : 'Scroll to zoom, drag to pan'}
            </p>
            <div
              className={`image-container ${selectionMode ? 'selection-mode' : ''}`}
              onClick={handleImageClick}
              onWheel={handleWheel}
            >
              <img
                src={imageUrl}
                alt="Scanned"
                style={{
                  transform: `scale(${zoom})`,
                }}
              />
              {isProcessingRegion && (
                <div className="processing-overlay">
                  Detecting...
                </div>
              )}
            </div>
          </div>
        )}

        <div className="words-section">
          <div className="section-header">
            <h2>Detected Words ({characters.length})</h2>
            <button className="add-button" onClick={() => setShowAddModal(true)} data-testid="button-add-word">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add
            </button>
          </div>

          {characters.length === 0 ? (
            <div className="empty-state">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
              </svg>
              <p>No words detected</p>
              <p className="small">Tap on words in the image or add them manually</p>
            </div>
          ) : (
            <div className="word-list">
              {characters.map((char, index) => (
                <div key={`${char.character}-${index}`} className="word-card" data-testid={`word-card-${index}`}>
                  <div className="word-info">
                    <span className="character-text">{char.character}</span>
                    <span className="pinyin-text">{char.pinyin}</span>
                    <span className="definition-text">{char.definition}</span>
                  </div>
                  <div className="word-actions">
                    <button className="action-button" onClick={() => handleEditWord(index)} data-testid={`button-edit-${index}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                      </svg>
                    </button>
                    <button className="action-button delete" onClick={() => handleDeleteWord(index)} data-testid={`button-delete-${index}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <footer className="review-footer">
        <button
          className={`finalise-button ${characters.length > 0 ? '' : 'disabled'}`}
          onClick={handleFinalise}
          disabled={characters.length === 0}
          data-testid="button-finalise"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Finalise & Start Practice
        </button>
      </footer>

      {(showAddModal || showEditModal) && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); setShowEditModal(false); resetInputs(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">{showEditModal ? 'Edit Word' : 'Add Word'}</h3>
            
            <label className="input-label">Chinese Character(s) *</label>
            <input
              type="text"
              className="modal-input"
              value={newCharacter}
              onChange={(e) => setNewCharacter(e.target.value)}
              placeholder="e.g., 学习"
              autoFocus
              data-testid="input-character"
            />
            
            <label className="input-label">Pinyin (optional)</label>
            <input
              type="text"
              className="modal-input"
              value={newPinyin}
              onChange={(e) => setNewPinyin(e.target.value)}
              placeholder="e.g., xué xí"
              data-testid="input-pinyin"
            />
            
            <label className="input-label">Definition (optional)</label>
            <input
              type="text"
              className="modal-input"
              value={newDefinition}
              onChange={(e) => setNewDefinition(e.target.value)}
              placeholder="e.g., to study, to learn"
              data-testid="input-definition"
            />
            
            <div className="modal-buttons">
              <button
                className="modal-button cancel"
                onClick={() => { setShowAddModal(false); setShowEditModal(false); resetInputs(); }}
                data-testid="button-modal-cancel"
              >
                Cancel
              </button>
              <button
                className="modal-button confirm"
                onClick={showEditModal ? handleSaveEdit : handleAddWord}
                data-testid="button-modal-confirm"
              >
                {showEditModal ? 'Save' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
