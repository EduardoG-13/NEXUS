// ============================================================
// TOAST SYSTEM V4 — Notificações globais
// 4 tipos: burn, session, promo, saved
// setInterval para alertas de sessão em tempo real
// ============================================================
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const ToastCtx = createContext(null);

let _toastId = 0;

export function ToastProvider({ children, calendar, games }) {
  const [toasts, setToasts] = useState([]);
  const intervalRef = useRef(null);

  const push = useCallback((type, text, duration = 4000) => {
    const id = ++_toastId;
    setToasts(prev => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
    return id;
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── setInterval: checa sessões ────────────────────────────
  // TODO: Conectar com notificações web (Notification API) no futuro
  useEffect(() => {
    if (!calendar || !games) return;

    intervalRef.current = setInterval(() => {
      const now = new Date();
      Object.entries(calendar).forEach(([key, entry]) => {
        const slotTime = new Date(key);
        const diffMs = slotTime - now;
        const diffMin = Math.round(diffMs / 60000);

        // 10 minutos antes da sessão
        if (diffMin === 10) {
          const game = games.find(g => g.id === entry.gameId);
          if (game) {
            push('session', `⏰ Sua sessão de "${game.title}" começa em 10 minutos!`, 6000);
          }
        }
        // 1 minuto antes
        if (diffMin === 1) {
          const game = games.find(g => g.id === entry.gameId);
          if (game) {
            push('session', `🎮 Hora de jogar! "${game.title}" começa agora.`, 8000);
          }
        }
      });
    }, 60000); // verifica todo minuto

    return () => clearInterval(intervalRef.current);
  }, [calendar, games, push]);

  return (
    <ToastCtx.Provider value={{ push, dismiss }}>
      {children}
      <ToastTray toasts={toasts} onDismiss={dismiss} />
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast deve ser usado dentro de ToastProvider');
  return ctx;
}

const TOAST_STYLES = {
  burn:    { border: 'var(--red)',          bg: 'var(--red-dim)',    icon: '🔥' },
  session: { border: 'var(--accent)',       bg: 'var(--accent-dim)', icon: '⏰' },
  promo:   { border: 'var(--green-bright)', bg: 'var(--green-dim)',  icon: '💰' },
  saved:   { border: 'var(--green-bright)', bg: 'var(--green-dim)',  icon: '✓'  },
  info:    { border: 'var(--border-hi)',    bg: 'var(--bg-elevated)',icon: 'ℹ'  },
};

function ToastTray({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 20, left: 20,
      display: 'flex', flexDirection: 'column', gap: 8,
      zIndex: 300, maxWidth: 340,
    }}>
      {toasts.map(t => {
        const s = TOAST_STYLES[t.type] || TOAST_STYLES.info;
        return (
          <div
            key={t.id}
            onClick={() => onDismiss(t.id)}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '10px 14px',
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderLeft: `3px solid ${s.border}`,
              borderRadius: 2,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-primary)',
              lineHeight: 1.5,
              cursor: 'pointer',
              animation: 'slide-up 180ms ease forwards',
            }}
          >
            <span style={{ flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
            <span style={{ flex: 1 }}>{t.text}</span>
            <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>✕</span>
          </div>
        );
      })}
    </div>
  );
}
