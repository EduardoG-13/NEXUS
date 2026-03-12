import { useState, useCallback } from 'react';
import './index.css';
import { GAMES_DEFAULT, WISHLIST_DEFAULT } from './data';
import { useLocalStorage } from './hooks/useLocalStorage';
import { ToastProvider, useToast } from './components/ToastSystem';
import { saveMemory } from './services/supermemoryService';

import LoginPage         from './views/LoginPage';
import SyncPage          from './views/SyncPage';
import Dashboard         from './views/Dashboard';
import Library           from './views/Library';
import SmartBuyV2        from './views/SmartBuyV2';
import TacticalCalendar  from './views/TacticalCalendar';
import Settings          from './views/Settings';
import AddGameModal      from './components/AddGameModal';
import OracleV2          from './components/OracleV2';

// ============================================================
// NAV ITEMS
// ============================================================
const NAV_ITEMS = [
  { id: 'dashboard', icon: '▣', label: 'Centro de Comando' },
  { id: 'library',   icon: '☰', label: 'Biblioteca'        },
  { id: 'smartbuy',  icon: '◈', label: 'Compra Inteligente' },
  { id: 'calendar',  icon: '⬡', label: 'Calendário Tático'  },
];

const INSIGHTS = {
  dashboard: (games) => {
    const bl = games.filter(g => g.status === 'backlog');
    const R = bl.reduce((s, g) => s + (g.pricePaid || 0), 0);
    const h = bl.reduce((s, g) => s + g.ttbMain, 0);
    return `${bl.length} jogos no backlog · R$${R.toFixed(0)} em capital parado · ${h}h de lazer por aproveitar. $19bi em jogos dormem na Steam — não seja parte da estatística.`;
  },
  library:   () => `Dica: 🔥 QUEIMAR remove o jogo do backlog e aumenta seu Score. Cada decisão deliberada libera carga mental.`,
  smartbuy:  () => `Benchmark: Netflix ≈ R$1,80/h. Qualquer jogo abaixo de R$3/h é um investimento eficiente em lazer.`,
  calendar:  (_, cal) => {
    const n = Object.keys(cal || {}).length;
    return `${n} sessão(ões) agendada(s) esta semana. Jogadores que planejam jogam 2x mais horas com mais satisfação.`;
  },
  settings:  () => `Configurações salvas localmente no navegador.`,
};

// ============================================================
// INNER APP (inside ToastProvider — can use useToast)
// ============================================================
function InnerApp() {
  const { push } = useToast();

  // ─── Auth state ───────────────────────
  const [appState,    setAppState]   = useState('login');
  const [loginMethod, setLoginMethod] = useState(null);
  const [view,        setView]        = useState('dashboard');

  // ─── Persisted state (localStorage) ──
  const [games,    setGames]    = useLocalStorage('bb_games',    GAMES_DEFAULT);
  const [profile,  setProfile]  = useLocalStorage('bb_profile',  { name: 'Gamer#7423', avatar: 'G', platforms: ['steam'], hltbPref: 'main' });
  const [calendar, setCalendar] = useLocalStorage('bb_calendar', {});
  const wishlist = WISHLIST_DEFAULT; // Wishlist é read-only por ora (mock)

  // ─── Ephemeral UI ─────────────────────
  const [scoreBonus,   setScoreBonus]   = useState(0);
  const [showModal,    setShowModal]    = useState(false);
  const [showOracle,   setShowOracle]   = useState(false);
  const [burnToasts,   setBurnToasts]   = useState([]);
  const [showFlash,    setShowFlash]    = useState(false);

  // ─── Auth ────────────────────
  function handleLogin(method) { setLoginMethod(method); setAppState('sync'); }
  function handleSyncComplete(steamGames, steamProfile) {
    // Atualiza perfil com o nome Steam real
    if (steamProfile?.name) {
      setProfile(prev => ({
        ...prev,
        name:      steamProfile.name,
        avatarUrl: steamProfile.avatarUrl ?? prev.avatarUrl,
        avatar:    steamProfile.name.slice(0, 2).toUpperCase(),
        steamId:   steamProfile.steamId,
      }));
    }
    // Merge de jogos Steam sem duplicar
    if (steamGames && steamGames.length > 0) {
      setGames(prev => {
        const existingIds = new Set(prev.map(g => g.id));
        const newGames    = steamGames.filter(g => !existingIds.has(g.id));
        return [...newGames, ...prev];
      });
    }
    setAppState('app');
  }

  // ─── BURN ────────────────────
  const handleBurn = useCallback((id) => {
    const game = games.find(g => g.id === id);
    setGames(prev => prev.filter(g => g.id !== id));
    setScoreBonus(prev => prev + 5);
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 600);
    const tid = Date.now();
    setBurnToasts(prev => [...prev, { id: tid }]);
    setTimeout(() => setBurnToasts(prev => prev.filter(t => t.id !== tid)), 2100);
    push('burn', `🔥 "${game?.title ?? 'Jogo'}" queimado · Backlog Score +5pts`);
    // Salva o evento no gráfico de conhecimento do gamer
    if (game) {
      saveMemory(
        `Jogador queimou (descartou) o jogo: "${game.title}". Gênero: ${game.genre ?? 'Desconhecido'}. HLTB: ${game.ttbMain}h. Motivo: decisão deliberada.`,
        { type: 'burn_event', gameId: game.id }
      );
    }
  }, [games, push, setGames]);

  const handleScoreBonusUsed = useCallback(() => setScoreBonus(0), []);

  // ─── PLAY ────────────────────
  const handlePlay = useCallback((id) => {
    setGames(prev => prev.map(g => g.id === id ? { ...g, status: 'playing' } : g));
    push('info', '▶ Jogo movido para JOGANDO.');
  }, [setGames, push]);

  // ─── Add Game ────────────────────────
  function handleAddGame(newGame) {
    setGames(prev => [newGame, ...prev]);
    push('info', `✓ "${newGame.title}" adicionado à biblioteca.`);
  }

  // ─── Profile ─────────────────────────
  function handleSaveProfile(updated) {
    setProfile(updated);
    push('saved', '✓ Configurações salvas.');
  }

  // ─── Route guards ─────────────────────
  if (appState === 'login') return <LoginPage onLogin={handleLogin} />;
  if (appState === 'sync')  return <SyncPage loginMethod={loginMethod} onComplete={handleSyncComplete} />;

  const backlogCount = games.filter(g => g.status === 'backlog').length;

  return (
    <>
      {/* Flash overlay */}
      {showFlash && <div className="burn-flash" key={Date.now()} />}

      {/* Floating score toasts */}
      {burnToasts.map(t => (
        <div key={t.id} className="score-float-toast">🔥 QUEIMADO · SCORE +5pts</div>
      ))}

      {/* Modals */}
      {showModal  && <AddGameModal onClose={() => setShowModal(false)} onSave={handleAddGame} />}
      {showOracle && <OracleV2 games={games} calendar={calendar} wishlist={wishlist} onClose={() => setShowOracle(false)} />}

      {/* Oracle FAB */}
      {!showOracle && (
        <button className="oracle-fab" onClick={() => setShowOracle(true)} id="btn-oracle-fab">
          <span>⬡</span> O ORÁCULO
        </button>
      )}

      <div className="app-shell">
        {/* ─── Sidebar ─── */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <img src="/logo.jpeg" alt="Nexus" style={{ height: 32, width: 32, objectFit: 'contain', borderRadius: 2, flexShrink: 0 }} />
            <div>
              <div className="brand-text">Nexus</div>
              <div className="brand-version">v4.0 · BETA</div>
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
                {item.id === 'calendar' && Object.keys(calendar).length > 0 && (
                  <span className="nav-badge" style={{ background: 'var(--green-dim)', color: 'var(--green-bright)', borderColor: 'var(--green-border)' }}>
                    {Object.keys(calendar).length}
                  </span>
                )}
              </button>
            ))}

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
              <div className="user-avatar">{profile.avatar || profile.name?.charAt(0) || 'G'}</div>
              <div>
                <div className="user-name">{profile.name}</div>
                <div className="user-plan">ACESSO ANTECIPADO</div>
              </div>
            </div>
            <div className="sync-status mt-2">
              <div className="dot-live" />
              STEAM · SINCRONIZADO
            </div>
          </div>
        </aside>

        {/* ─── Main ─── */}
        <main className="main-content">
          {view === 'dashboard' && (
            <Dashboard
              games={games}
              scoreBonus={scoreBonus}
              onScoreBonusUsed={handleScoreBonusUsed}
              calendar={calendar}
            />
          )}
          {view === 'library' && (
            <Library games={games} onBurn={handleBurn} onPlay={handlePlay} onAddGame={() => setShowModal(true)} />
          )}
          {view === 'smartbuy'  && <SmartBuyV2 games={games} wishlist={wishlist} />}
          {view === 'calendar'  && (
            <TacticalCalendar
              games={games}
              calendar={calendar}
              onCalendarChange={setCalendar}
              wishlist={wishlist}
            />
          )}
          {view === 'settings'  && (
            <Settings profile={profile} onSave={handleSaveProfile} />
          )}

          {/* Insight footer */}
          {view !== 'settings' && (
            <div className="insight-footer">
              <span className="insight-tag">INSIGHT</span>
              <span>{INSIGHTS[view]?.(games, calendar)}</span>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

// ============================================================
// ROOT — wraps with ToastProvider so useToast works inside
// ============================================================
export default function App() {
  // Need games + calendar at root level for ToastProvider's setInterval
  const [games]    = useLocalStorage('bb_games',    GAMES_DEFAULT);
  const [calendar] = useLocalStorage('bb_calendar', {});

  return (
    <ToastProvider calendar={calendar} games={games}>
      <InnerApp />
    </ToastProvider>
  );
}
