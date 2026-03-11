import { Switch, Route, useLocation } from 'wouter';
import PracticeScreen from './screens/PracticeScreen';
import ReviewScreen from './screens/ReviewScreen';
import PracticeSessionScreen from './screens/PracticeSessionScreen';
import HistoryScreen from './screens/HistoryScreen';
import SettingsScreen from './screens/SettingsScreen';
import './styles/App.css';

function TabBar() {
  const [location, navigate] = useLocation();
  
  const isSubScreen = location.startsWith('/review') || location.startsWith('/session');
  
  if (isSubScreen) return null;

  return (
    <nav className="tab-bar">
      <button
        className={`tab-button ${location === '/' || location === '/practice' ? 'active' : ''}`}
        onClick={() => navigate('/practice')}
        data-testid="tab-practice"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        <span>Practice</span>
      </button>
      <button
        className={`tab-button ${location === '/history' ? 'active' : ''}`}
        onClick={() => navigate('/history')}
        data-testid="tab-history"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        <span>History</span>
      </button>
      <button
        className={`tab-button ${location === '/settings' ? 'active' : ''}`}
        onClick={() => navigate('/settings')}
        data-testid="tab-settings"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        <span>Settings</span>
      </button>
    </nav>
  );
}

function Router() {
  const [, navigate] = useLocation();

  return (
    <Switch>
      <Route path="/">
        <PracticeScreen 
          onNavigateToReview={(params) => {
            sessionStorage.setItem('reviewParams', JSON.stringify(params));
            navigate('/review');
          }}
        />
      </Route>
      <Route path="/practice">
        <PracticeScreen 
          onNavigateToReview={(params) => {
            sessionStorage.setItem('reviewParams', JSON.stringify(params));
            navigate('/review');
          }}
        />
      </Route>
      <Route path="/review">
        <ReviewScreenWrapper />
      </Route>
      <Route path="/session">
        <SessionScreenWrapper />
      </Route>
      <Route path="/history">
        <HistoryScreen
          onStartSession={(session) => {
            sessionStorage.setItem('sessionParams', JSON.stringify({
              characters: session.characters,
              sessionName: session.name,
              isShuffled: session.isShuffled || false,
              sessionId: session.id,
            }));
            navigate('/session');
          }}
        />
      </Route>
      <Route path="/settings">
        <SettingsScreen />
      </Route>
      <Route>
        <PracticeScreen 
          onNavigateToReview={(params) => {
            sessionStorage.setItem('reviewParams', JSON.stringify(params));
            navigate('/review');
          }}
        />
      </Route>
    </Switch>
  );
}

function ReviewScreenWrapper() {
  const [, navigate] = useLocation();
  
  const paramsStr = sessionStorage.getItem('reviewParams');
  if (!paramsStr) {
    navigate('/practice');
    return null;
  }

  const params = JSON.parse(paramsStr);

  return (
    <ReviewScreen
      characters={params.characters}
      imageUrl={params.imageUrl}
      sessionName={params.sessionName}
      shuffleWords={params.shuffleWords}
      onBack={() => {
        sessionStorage.removeItem('reviewParams');
        navigate('/practice');
      }}
      onStartSession={(chars, name, shuffled) => {
        sessionStorage.removeItem('reviewParams');
        sessionStorage.setItem('sessionParams', JSON.stringify({
          characters: chars,
          sessionName: name,
          isShuffled: shuffled,
        }));
        navigate('/session');
      }}
    />
  );
}

function SessionScreenWrapper() {
  const [, navigate] = useLocation();
  
  const paramsStr = sessionStorage.getItem('sessionParams');
  if (!paramsStr) {
    navigate('/practice');
    return null;
  }

  const params = JSON.parse(paramsStr);

  return (
    <PracticeSessionScreen
      characters={params.characters}
      sessionName={params.sessionName}
      isShuffled={params.isShuffled}
      sessionId={params.sessionId}
      onClose={() => {
        sessionStorage.removeItem('sessionParams');
        navigate('/practice');
      }}
    />
  );
}

export default function App() {
  return (
    <div className="app-container">
      <main className="main-content">
        <Router />
      </main>
      <TabBar />
    </div>
  );
}
