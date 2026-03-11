import { useState, useEffect } from 'react';
import { HistorySession } from '../types';
import { useHistoryStore } from '../lib/storage';
import './HistoryScreen.css';

interface Props {
  onStartSession: (session: HistorySession) => void;
}

export default function HistoryScreen({ onStartSession }: Props) {
  const { sessions, loadSessions, deleteSession, updateSessionName } = useHistoryStore();
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameSessionId, setRenameSessionId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleSessionClick = (session: HistorySession) => {
    onStartSession(session);
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string, sessionName: string) => {
    e.stopPropagation();
    if (confirm(`Delete "${sessionName}"?`)) {
      deleteSession(sessionId);
    }
  };

  const handleRenameClick = (e: React.MouseEvent, session: HistorySession) => {
    e.stopPropagation();
    setRenameSessionId(session.id);
    setNewName(session.name || '');
    setShowRenameModal(true);
  };

  const handleRenameConfirm = () => {
    if (renameSessionId && newName.trim()) {
      updateSessionName(renameSessionId, newName.trim());
    }
    setShowRenameModal(false);
    setRenameSessionId(null);
    setNewName('');
  };

  const handleRenameCancel = () => {
    setShowRenameModal(false);
    setRenameSessionId(null);
    setNewName('');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="history-screen">
      <header className="history-header">
        <h1>History</h1>
      </header>

      {sessions.length === 0 ? (
        <div className="empty-container">
          <div className="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <h2 className="empty-title">No practice sessions yet</h2>
          <p className="empty-description">Your completed practice sessions will appear here</p>
        </div>
      ) : (
        <div className="session-list">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="session-item"
              onClick={() => handleSessionClick(session)}
              data-testid={`session-item-${session.id}`}
            >
              <div className="session-content">
                <div className="session-header">
                  <span className="session-name">{session.name || 'Untitled Session'}</span>
                  {session.isShuffled && (
                    <span className="shuffle-badge">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="16 3 21 3 21 8" />
                        <line x1="4" y1="20" x2="21" y2="3" />
                        <polyline points="21 16 21 21 16 21" />
                        <line x1="15" y1="15" x2="21" y2="21" />
                        <line x1="4" y1="4" x2="9" y2="9" />
                      </svg>
                    </span>
                  )}
                </div>
                <p className="preview-text">
                  {session.characters.slice(0, 3).map((c) => c.character).join(' ')}
                </p>
                <p className="date-text">{formatDate(session.createdAt)}</p>
              </div>
              <div className="session-actions">
                <button className="action-btn" onClick={(e) => handleRenameClick(e, session)} data-testid={`button-rename-${session.id}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                  </svg>
                </button>
                <button className="action-btn delete" onClick={(e) => handleDeleteSession(e, session.id, session.name)} data-testid={`button-delete-${session.id}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
              <span className="badge">{session.characters.length}</span>
            </div>
          ))}
        </div>
      )}

      {showRenameModal && (
        <div className="modal-overlay" onClick={handleRenameCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Rename Session</h3>
            <input
              type="text"
              className="modal-input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Session name"
              autoFocus
              data-testid="input-rename"
            />
            <div className="modal-buttons">
              <button className="modal-button cancel" onClick={handleRenameCancel} data-testid="button-rename-cancel">
                Cancel
              </button>
              <button className="modal-button confirm" onClick={handleRenameConfirm} data-testid="button-rename-confirm">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
