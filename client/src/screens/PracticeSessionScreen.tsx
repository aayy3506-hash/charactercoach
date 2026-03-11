import { useState, useEffect, useRef, useCallback } from 'react';
import { CharacterData } from '../types';
import { speakText, stopSpeaking } from '../lib/speech';
import { defineCharacter, CharacterDefinition } from '../lib/api';
import { useSettingsStore, useHistoryStore } from '../lib/storage';
import './PracticeSessionScreen.css';

interface Props {
  characters: CharacterData[];
  sessionName: string;
  isShuffled: boolean;
  sessionId?: string;
  onClose: () => void;
}

function CharacterPopover({
  definition,
  onClose,
  anchorRect,
}: {
  definition: CharacterDefinition;
  onClose: () => void;
  anchorRect: DOMRect | null;
}) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside as EventListener);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as EventListener);
    };
  }, [onClose]);

  const style: React.CSSProperties = {};
  if (anchorRect) {
    const viewportWidth = window.innerWidth;
    const popoverWidth = Math.min(320, viewportWidth - 32);
    let left = anchorRect.left + anchorRect.width / 2 - popoverWidth / 2;
    if (left < 16) left = 16;
    if (left + popoverWidth > viewportWidth - 16) left = viewportWidth - 16 - popoverWidth;
    style.left = `${left}px`;
    style.width = `${popoverWidth}px`;

    const spaceBelow = window.innerHeight - anchorRect.bottom;
    if (spaceBelow > 250) {
      style.top = `${anchorRect.bottom + 8}px`;
    } else {
      style.bottom = `${window.innerHeight - anchorRect.top + 8}px`;
    }
  }

  return (
    <div className="popover-overlay">
      <div className="character-popover" ref={popoverRef} style={style} data-testid="popover-character-define">
        <div className="popover-header">
          <span className="popover-char" data-testid="popover-char">{definition.character}</span>
          <span className="popover-pinyin" data-testid="popover-pinyin">{definition.pinyin}</span>
          <button className="popover-close" onClick={onClose} data-testid="button-popover-close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <p className="popover-definition" data-testid="popover-definition">{definition.definition}</p>
        <p className="popover-details" data-testid="popover-details">{definition.details}</p>
        {definition.examples && definition.examples.length > 0 && (
          <div className="popover-examples">
            <p className="popover-examples-label">Common Words:</p>
            {definition.examples.map((ex, i) => (
              <div className="popover-example" key={i} data-testid={`popover-example-${i}`}>
                <span className="example-word">{ex.word}</span>
                <span className="example-pinyin">{ex.pinyin}</span>
                <span className="example-meaning">{ex.meaning}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PracticeSessionScreen({
  characters,
  sessionName,
  isShuffled,
  sessionId,
  onClose,
}: Props) {
  const {
    pauseDuration,
    speechRate,
    autoPlay,
    showPinyin,
    showDefinitions,
    repeatCount,
    autoAdvanceEnabled,
  } = useSettingsStore();

  const { saveSession } = useHistoryStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [countdown, setCountdown] = useState(pauseDuration);
  const [currentRepeat, setCurrentRepeat] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [popoverChar, setPopoverChar] = useState<string | null>(null);
  const [popoverDefinition, setPopoverDefinition] = useState<CharacterDefinition | null>(null);
  const [popoverLoading, setPopoverLoading] = useState(false);
  const [popoverAnchor, setPopoverAnchor] = useState<DOMRect | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasSpokenRef = useRef(false);
  const hasSavedRef = useRef(false);

  const currentChar = characters[currentIndex];

  const speak = useCallback(
    (text: string, onComplete?: () => void) => {
      stopSpeaking();
      setIsSpeaking(true);
      speakText(text, {
        rate: speechRate,
        onEnd: () => {
          setIsSpeaking(false);
          onComplete?.();
        },
        onError: () => {
          setIsSpeaking(false);
          onComplete?.();
        },
      });
    },
    [speechRate]
  );

  useEffect(() => {
    if (!sessionId && characters.length > 0 && sessionName && !hasSavedRef.current) {
      hasSavedRef.current = true;
      saveSession(characters, sessionName, undefined, isShuffled);
    }
  }, [sessionId, characters, sessionName, isShuffled, saveSession]);

  useEffect(() => {
    hasSpokenRef.current = false;
    setCurrentRepeat(1);
  }, [currentIndex]);

  useEffect(() => {
    if (!hasSpokenRef.current && isPlaying) {
      hasSpokenRef.current = true;
      speak(currentChar.character, () => {
        setCountdown(pauseDuration);
      });
    }
  }, [currentIndex, currentChar.character, speak, isPlaying, pauseDuration]);

  useEffect(() => {
    if (isPlaying && !isSpeaking) {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (currentRepeat < repeatCount) {
              setCurrentRepeat((r) => r + 1);
              speak(currentChar.character, () => {
                setCountdown(pauseDuration);
              });
              return pauseDuration;
            } else if (autoAdvanceEnabled) {
              if (currentIndex < characters.length - 1) {
                setCurrentIndex((i) => i + 1);
                return pauseDuration;
              } else {
                setIsPlaying(false);
                return 0;
              }
            } else {
              setIsPlaying(false);
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, isSpeaking, currentIndex, currentRepeat, repeatCount, autoAdvanceEnabled, characters.length, pauseDuration, speak, currentChar.character]);

  useEffect(() => {
    return () => {
      stopSpeaking();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const goToNext = useCallback(() => {
    if (currentIndex < characters.length - 1) {
      setCurrentIndex((i) => i + 1);
      setCountdown(pauseDuration);
      setCurrentRepeat(1);
    }
  }, [currentIndex, characters.length, pauseDuration]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setCountdown(pauseDuration);
      setCurrentRepeat(1);
    }
  }, [currentIndex, pauseDuration]);

  const togglePlayPause = useCallback(() => {
    if (!isPlaying) {
      setCountdown(pauseDuration);
      speak(currentChar.character, () => {
        setCountdown(pauseDuration);
      });
    }
    setIsPlaying((prev) => !prev);
  }, [isPlaying, pauseDuration, speak, currentChar.character]);

  const handleClose = () => {
    stopSpeaking();
    onClose();
  };

  const handleReplay = () => {
    speak(currentChar.character);
  };

  const handleCharTap = async (char: string, event: React.MouseEvent | React.TouchEvent) => {
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    setPopoverAnchor(rect);
    setPopoverChar(char);
    setPopoverLoading(true);
    setPopoverDefinition(null);

    try {
      const def = await defineCharacter(char, currentChar.character);
      setPopoverDefinition(def);
    } catch {
      setPopoverDefinition({
        character: char,
        pinyin: '',
        definition: 'Could not load definition',
        details: 'Please try again later.',
        examples: [],
      });
    } finally {
      setPopoverLoading(false);
    }
  };

  const closePopover = () => {
    setPopoverChar(null);
    setPopoverDefinition(null);
    setPopoverLoading(false);
    setPopoverAnchor(null);
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (popoverChar) {
        if (e.key === 'Escape') closePopover();
        return;
      }
      switch (e.key) {
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
      }
    },
    [goToPrevious, goToNext, togglePlayPause, popoverChar]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const individualChars = currentChar.character.split('');
  const isMultiChar = individualChars.length > 1;

  return (
    <div className="session-screen">
      <header className="session-header">
        <button className="header-btn" onClick={handleClose} data-testid="button-close-session">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="progress-info">
          <span className="progress-text" data-testid="text-progress">
            {currentIndex + 1}/{characters.length}
          </span>
          {isShuffled && (
            <span className="shuffle-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 3 21 3 21 8" />
                <line x1="4" y1="20" x2="21" y2="3" />
                <polyline points="21 16 21 21 16 21" />
                <line x1="15" y1="15" x2="21" y2="21" />
                <line x1="4" y1="4" x2="9" y2="9" />
              </svg>
            </span>
          )}
          {isPlaying && (
            <span className="countdown-badge" data-testid="text-countdown">{countdown}s</span>
          )}
        </div>

        <button className="header-btn" onClick={togglePlayPause} data-testid="button-play-pause-header">
          {isPlaying ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>
      </header>

      <main className="session-content">
        <div className="character-container">
          <div className="character-card" onClick={isMultiChar ? undefined : handleReplay} data-testid="container-character">
            {isMultiChar ? (
              <span className="character interactive-chars" data-testid="text-character">
                {individualChars.map((ch, i) => (
                  <span
                    key={i}
                    className="single-char-tap"
                    onClick={(e) => handleCharTap(ch, e)}
                    data-testid={`char-tap-${i}`}
                  >
                    {ch}
                  </span>
                ))}
              </span>
            ) : (
              <span className="character" onClick={handleReplay} data-testid="text-character">
                {currentChar.character}
              </span>
            )}
          </div>
          {isMultiChar && (
            <p className="tap-hint" data-testid="text-tap-hint">Tap a character to see its definition</p>
          )}
          {showPinyin && (
            <p className="pinyin" data-testid="text-pinyin">{currentChar.pinyin}</p>
          )}
          {showDefinitions && (
            <p className="definition" data-testid="text-definition">{currentChar.definition}</p>
          )}
          <div className="repeat-indicator">
            {Array.from({ length: repeatCount }).map((_, index) => (
              <span
                key={index}
                className={`repeat-dot ${index < currentRepeat ? 'active' : ''}`}
              />
            ))}
          </div>
          <button className="replay-btn" onClick={handleReplay} data-testid="button-replay">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          </button>
        </div>

        <div className="navigation-row">
          <button
            className="nav-button"
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            data-testid="button-previous"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <button className="play-button" onClick={togglePlayPause} data-testid="button-play-pause">
            {isPlaying ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>

          <button
            className="nav-button"
            onClick={goToNext}
            disabled={currentIndex === characters.length - 1}
            data-testid="button-next"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </main>

      <footer className="session-footer">
        <div className="progress-dots">
          {characters.slice(0, Math.min(characters.length, 20)).map((_, index) => (
            <span
              key={index}
              className={`dot ${index === currentIndex ? 'active' : ''}`}
            />
          ))}
          {characters.length > 20 && (
            <span className="more-indicator">+{characters.length - 20}</span>
          )}
        </div>
        <p className="footer-text">
          {autoAdvanceEnabled
            ? `Auto-advance after ${repeatCount}x repeats`
            : 'Use arrow keys or swipe to navigate'}
        </p>
      </footer>

      {popoverChar && popoverLoading && (
        <div className="popover-overlay">
          <div className="character-popover loading" style={popoverAnchor ? {
            left: `${Math.max(16, popoverAnchor.left + popoverAnchor.width / 2 - 160)}px`,
            top: `${popoverAnchor.bottom + 8}px`,
            width: '320px',
          } : {}}>
            <div className="popover-loading">
              <div className="loading-spinner" />
              <span>Looking up {popoverChar}...</span>
            </div>
          </div>
        </div>
      )}

      {popoverDefinition && (
        <CharacterPopover
          definition={popoverDefinition}
          onClose={closePopover}
          anchorRect={popoverAnchor}
        />
      )}
    </div>
  );
}
