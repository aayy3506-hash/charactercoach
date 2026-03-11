import { useState, useRef } from 'react';
import { CharacterData } from '../types';
import { processImageOCR } from '../lib/api';
import './PracticeScreen.css';

interface Props {
  onNavigateToReview: (params: {
    characters: CharacterData[];
    imageUrl?: string;
    sessionName: string;
    shuffleWords: boolean;
  }) => void;
}

export default function PracticeScreen({ onNavigateToReview }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [shuffleWords, setShuffleWords] = useState(false);
  const [pendingCharacters, setPendingCharacters] = useState<CharacterData[]>([]);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getDefaultSessionName = () => {
    const now = new Date();
    return `Session ${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const reader = new FileReader();
      const imageUrl = URL.createObjectURL(file);
      
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const characters = await processImageOCR(base64);
      
      if (characters && characters.length > 0) {
        setPendingCharacters(characters);
        setPendingImageUrl(imageUrl);
        setSessionName(getDefaultSessionName());
        setShowModal(true);
      } else {
        setError('No Chinese characters found. Please try another photo.');
      }
    } catch (err: unknown) {
      console.error('OCR error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to process the image. Please try again.';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStartPractice = () => {
    setShowModal(false);
    const finalName = sessionName.trim() || getDefaultSessionName();
    
    onNavigateToReview({
      characters: pendingCharacters,
      imageUrl: pendingImageUrl,
      sessionName: finalName,
      shuffleWords,
    });

    setPendingCharacters([]);
    setPendingImageUrl(undefined);
    setSessionName('');
    setShuffleWords(false);
  };

  const handleCancel = () => {
    setShowModal(false);
    setPendingCharacters([]);
    if (pendingImageUrl) {
      URL.revokeObjectURL(pendingImageUrl);
    }
    setPendingImageUrl(undefined);
    setSessionName('');
    setShuffleWords(false);
  };

  return (
    <div className="practice-screen">
      {isProcessing ? (
        <div className="loading-container">
          <div className="spinner" />
          <p className="loading-text">识别中...</p>
          <p className="loading-subtext">Recognizing characters</p>
        </div>
      ) : (
        <>
          <div className="empty-state">
            <div className="icon-container">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <h2 className="empty-title">Scan or Upload Characters</h2>
            <p className="empty-description">
              Upload an image of Chinese characters to start practicing
            </p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="button-container">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="camera-input"
              data-testid="input-camera"
            />
            <label htmlFor="camera-input" className="button primary" data-testid="button-take-photo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Take Photo
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="upload-input"
              data-testid="input-upload"
            />
            <label htmlFor="upload-input" className="button secondary" data-testid="button-upload">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              Upload from Photos
            </label>
          </div>
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Name Your Session</h3>
            <p className="modal-subtitle">{pendingCharacters.length} characters found</p>
            
            <input
              type="text"
              className="name-input"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="e.g., Week 1 Spelling"
              autoFocus
              data-testid="input-session-name"
            />

            <div className="shuffle-row">
              <div className="shuffle-label">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 3 21 3 21 8" />
                  <line x1="4" y1="20" x2="21" y2="3" />
                  <polyline points="21 16 21 21 16 21" />
                  <line x1="15" y1="15" x2="21" y2="21" />
                  <line x1="4" y1="4" x2="9" y2="9" />
                </svg>
                Shuffle Words
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={shuffleWords}
                  onChange={(e) => setShuffleWords(e.target.checked)}
                  data-testid="toggle-shuffle"
                />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="modal-buttons">
              <button className="modal-button cancel" onClick={handleCancel} data-testid="button-cancel">
                Cancel
              </button>
              <button className="modal-button confirm" onClick={handleStartPractice} data-testid="button-start-practice">
                Start Practice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
