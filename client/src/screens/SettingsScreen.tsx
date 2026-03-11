import { useSettingsStore } from '../lib/storage';
import './SettingsScreen.css';

export default function SettingsScreen() {
  const {
    pauseDuration,
    speechRate,
    autoPlay,
    showPinyin,
    showDefinitions,
    repeatCount,
    autoAdvanceEnabled,
    setPauseDuration,
    setSpeechRate,
    setAutoPlay,
    setShowPinyin,
    setShowDefinitions,
    setRepeatCount,
    setAutoAdvanceEnabled,
  } = useSettingsStore();

  return (
    <div className="settings-screen">
      <header className="settings-header">
        <h1>Settings</h1>
      </header>

      <div className="settings-content">
        <section className="settings-section">
          <p className="section-title">PROFILE</p>
          <div className="section-content">
            <div className="profile-row">
              <div className="avatar">学</div>
              <div className="profile-info">
                <span className="profile-name">学习者</span>
                <span className="profile-subtitle">Learner</span>
              </div>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <p className="section-title">REPETITION SETTINGS</p>
          <div className="section-content">
            <div className="settings-row">
              <span className="row-label">Repeat Count</span>
              <span className="row-value" data-testid="text-repeat-count">{repeatCount}x</span>
            </div>
            <div className="slider-container">
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={repeatCount}
                onChange={(e) => setRepeatCount(Number(e.target.value))}
                className="slider"
                data-testid="slider-repeat-count"
              />
              <div className="slider-labels">
                <span>1x</span>
                <span>5x</span>
              </div>
            </div>
            <p className="helper-text">Number of times each word is read before moving to the next</p>
            
            <div className="divider" />
            
            <div className="settings-row">
              <span className="row-label">Pause Between Repeats</span>
              <span className="row-value" data-testid="text-pause-duration">{pauseDuration}s</span>
            </div>
            <div className="slider-container">
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={pauseDuration}
                onChange={(e) => setPauseDuration(Number(e.target.value))}
                className="slider"
                data-testid="slider-pause-duration"
              />
              <div className="slider-labels">
                <span>1s</span>
                <span>10s</span>
              </div>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <p className="section-title">NAVIGATION SETTINGS</p>
          <div className="section-content">
            <div className="settings-row">
              <div className="row-content">
                <span className="row-label">Auto-advance</span>
                <span className="row-description">Move to next word automatically after repeats</span>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={autoAdvanceEnabled}
                  onChange={(e) => setAutoAdvanceEnabled(e.target.checked)}
                  data-testid="toggle-auto-advance"
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <p className="section-title">PLAYBACK SETTINGS</p>
          <div className="section-content">
            <div className="settings-row">
              <span className="row-label">Speech Rate</span>
              <span className="row-value" data-testid="text-speech-rate">{speechRate.toFixed(1)}x</span>
            </div>
            <div className="slider-container">
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={speechRate}
                onChange={(e) => setSpeechRate(Number(e.target.value))}
                className="slider"
                data-testid="slider-speech-rate"
              />
              <div className="slider-labels">
                <span>0.5x</span>
                <span>2x</span>
              </div>
            </div>
            
            <div className="divider" />
            
            <div className="settings-row">
              <span className="row-label">Auto-play on Start</span>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={autoPlay}
                  onChange={(e) => setAutoPlay(e.target.checked)}
                  data-testid="toggle-auto-play"
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <p className="section-title">DISPLAY PREFERENCES</p>
          <div className="section-content">
            <div className="settings-row">
              <span className="row-label">Show Pinyin</span>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={showPinyin}
                  onChange={(e) => setShowPinyin(e.target.checked)}
                  data-testid="toggle-show-pinyin"
                />
                <span className="toggle-slider" />
              </label>
            </div>
            
            <div className="divider" />
            
            <div className="settings-row">
              <span className="row-label">Show Definitions</span>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={showDefinitions}
                  onChange={(e) => setShowDefinitions(e.target.checked)}
                  data-testid="toggle-show-definitions"
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
        </section>

        <footer className="settings-footer">
          <p>汉字练习 v1.0.0</p>
        </footer>
      </div>
    </div>
  );
}
