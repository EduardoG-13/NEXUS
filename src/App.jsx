import { useState, useCallback } from 'react';
import './index.css';
import { GAMES } from './data';
import LoginPage     from './views/LoginPage';
import SyncPage      from './views/SyncPage';
import Dashboard     from './views/Dashboard';
import Library       from './views/Library';
import SmartBuy      from './views/SmartBuy';
import Settings      from './views/Settings';
import AddGameModal  from './components/AddGameModal';
import OracleChat    from './components/OracleChat';

// ============================================================
// APP STATE: 'login' | 'sync' | 'app'
// VIEW STATE: 'dashboard' | 'library' | 'smartbuy' | 'settings'
// ============================================================

const NAV_ITEMS = [
  { id: 'dashboard', icon: '▣', label: 'Centro de Comando' },
  { id: 'library',   icon: '☰', label: 'Biblioteca'       },
  { id: 'smartbuy',  icon: '◈', label: 'Compra Inteligente' },
];

const HINTS = {
  dashboard: (games) => {
    const bl = games.filter(g => g.status === 'backlog');
    const R = bl.reduce((s, g) => s + g.price, 0);
    const h = bl.reduce((s, g) => s + g.ttbMain, 0);
    return `${bl.length} jogos no backlog · R$${R.toFixed(0)} em capital parado · ${h}h de lazer por aproveitar.`;
  },
  library:   () => `Dica: use 🔥 QUEIMAR em jogos que você nunca vai jogar. Cada decisão libera carga mental.`,
  smartbuy:  () => `Referência: Netflix ≈ R$1,80/h de conteúdo. Qualquer jogo abaixo de R$3/h é eficiente.`,
  settings:  () => `Suas preferências são salvas localmente no navegador.`,
};

const DEFAULT_PROFILE = {
  name: 'Gamer#7423',
  avatar: 'G',
  platforms: ['steam'],
  theme: 'dark',
  hltbPref: 'main',
};

export default function App() {
  // Auth flow
  const [appState,    setAppState]   = useState('login');
  const [loginMethod, setLoginMethod] = useState(null);

  // Navigation
  const [view, setView] = useState('dashboard');

  // Data
  const [games,   setGames]   = useState(GAMES);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);

  // Score bonus (from BURN actions)
  const [scoreBonus, setScoreBonus] = useState(0);

  // UI state
  const [showModal,  setShowModal]  = useState(false);
  const [showOracle, setShowOracle] = useState(false);
  const [burnToasts, setBurnToasts] = useState([]); // [{ id, pts }]
  const [showFlash,  setShowFlash]  = useState(false);

  // ──────────────────────────────────────────────────────────
  // Auth handlers
  // ──────────────────────────────────────────────────────────
  function handleLogin(method) {
    setLoginMethod(method);
    setAppState('sync');
  }

  function handleSyncComplete() {
    setAppState('app');
  }

  // ──────────────────────────────────────────────────────────
  // BURN — remove jogo + score +5 + flash + toast
  // ──────────────────────────────────────────────────────────
  const handleBurn = useCallback((id) => {
    setGames(prev => prev.filter(g => g.id !== id));
    setScoreBonus(prev => prev + 5);

    // Flash de tela
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 600);

    // Floating toast +5pts
    const toastId = Date.now();
    setBurnToasts(prev => [...prev, { id: toastId, pts: 5 }]);
    setTimeout(() => setBurnToasts(prev => prev.filter(t => t.id !== toastId)), 2100);
  }, []);

  const handleScoreBonusUsed = useCallback(() => {
    setScoreBonus(0);
  }, []);

  // ──────────────────────────────────────────────────────────
  // Add Game
  // ──────────────────────────────────────────────────────────
  function handleAddGame(newGame) {
    setGames(prev => [newGame, ...prev]);
    // New backlog game = reduce score
    if (newGame.status === 'backlog') {
      setScoreBonus(prev => Math.max(0, prev - 3));
    }
  }

  // ──────────────────────────────────────────────────────────
  // Settings save
  // ──────────────────────────────────────────────────────────
  function handleSaveProfile(updated) {
    setProfile(updated);
  }

  // ──────────────────────────────────────────────────────────
  // Route: Login / Sync
  // ──────────────────────────────────────────────────────────
  if (appState === 'login') return <LoginPage onLogin={handleLogin} />;
  if (appState === 'sync')  return <SyncPage loginMethod={loginMethod} onComplete={handleSyncComplete} />;

  const backlogCount = games.filter(g => g.status === 'backlog').length;

  // ──────────────────────────────────────────────────────────
  // Main App Shell
  // ──────────────────────────────────────────────────────────
  return (
    <>
      {/* Burn flash overlay */}
      {showFlash && <div className="burn-flash" key={Date.now()} />}

      {/* Floating score toasts */}
      {burnToasts.map(t => (
        <div key={t.id} className="score-float-toast">
          🔥 QUEIMADO · SCORE +{t.pts}pts
        </div>
      ))}

      {/* Add Game Modal */}
      {showModal && (
        <AddGameModal
          onClose={() => setShowModal(false)}
          onSave={handleAddGame}
        />
      )}

      {/* O Oráculo Chat */}
      {showOracle && (
        <OracleChat
          games={games}
          onClose={() => setShowOracle(false)}
        />
      )}

      {/* Oracle FAB (hidden when oracle is open) */}
      {!showOracle && appState === 'app' && (
        <button
          className="oracle-fab"
          onClick={() => setShowOracle(true)}
          id="btn-open-oracle"
        >
          <span>⬡</span> O ORÁCULO
        </button>
      )}

      {/* App Shell */}
      <div className="app-shell">
        {/* ─── Sidebar ─── */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="brand-mark">B</div>
            <div>
              <div className="brand-text">BacklogBurner</div>
              <div className="brand-version">v3.0 · BETA</div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section-label">NAVEGAÇÃO</div>
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                className={`nav-item ${view === item.id ? 'active' : ''}`}
                onClick={() => setView(item.id)}
                id={`nav-${item.id}`}
              >
                <span className="nav-icon" style={{ fontFamily: 'var(--font-mono)' }}>{item.icon}</span>
                <span>{item.label}</span>
                {item.id === 'library' && backlogCount > 0 && (
                  <span className="nav-badge">{backlogCount}</span>
                )}
              </button>
            ))}

            {/* Quick Add */}
            <button
              className="nav-item"
              style={{ marginTop: 8, border: '1px dashed var(--border-hi)', color: 'var(--text-muted)' }}
              onClick={() => { setView('library'); setShowModal(true); }}
              id="nav-add-game"
            >
              <span className="nav-icon">+</span>
              <span>Adicionar Jogo</span>
            </button>

            <div className="nav-section-label" style={{ marginTop: 16 }}>SISTEMA</div>
            <button
              className={`nav-item ${view === 'settings' ? 'active' : ''}`}
              onClick={() => setView('settings')}
              id="nav-settings"
            >
              <span className="nav-icon">⚙</span>
              <span>Configurações</span>
            </button>
            <button
              className="nav-item"
              onClick={() => setShowOracle(v => !v)}
              style={showOracle ? { color: 'var(--accent)', borderColor: 'var(--accent-border)', background: 'var(--accent-dim)' } : {}}
            >
              <span className="nav-icon">⬡</span>
              <span>O Oráculo</span>
            </button>
            <button className="nav-item" onClick={() => setAppState('login')}>
              <span className="nav-icon">←</span>
              <span>Sair</span>
            </button>
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-user">
              <div className="user-avatar">{profile.avatar}</div>
              <div>
                <div className="user-name">{profile.name}</div>
                <div className="user-plan">EARLY ACCESS</div>
              </div>
            </div>
            <div className="sync-status mt-2">
              <div className="dot-live" />
              STEAM · SINCRONIZADO
            </div>
          </div>
        </aside>

        {/* ─── Main Content ─── */}
        <main className="main-content">
          {view === 'dashboard' && (
            <Dashboard
              games={games}
              scoreBonus={scoreBonus}
              onScoreBonusUsed={handleScoreBonusUsed}
            />
          )}
          {view === 'library' && (
            <Library
              games={games}
              onBurn={handleBurn}
              onAddGame={() => setShowModal(true)}
            />
          )}
          {view === 'smartbuy' && <SmartBuy />}
          {view === 'settings' && (
            <Settings profile={profile} onSave={handleSaveProfile} />
          )}

          {/* Insight Footer */}
          {view !== 'settings' && (
            <div className="insight-footer">
              <span className="insight-tag">INSIGHT</span>
              <span>{HINTS[view]?.(games)}</span>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
