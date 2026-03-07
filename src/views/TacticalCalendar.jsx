// ============================================================
// TACTICAL CALENDAR V4
// Semana atual · Slots 18h-22h · Agendamento rápido
// Salvo em bb_calendar no localStorage via prop onSave
// ============================================================
import { useState, useMemo } from 'react';
import { useToast } from '../components/ToastSystem';

const HOUR_SLOTS = [18, 19, 20, 21, 22];
const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function getWeekDays() {
  const today = new Date();
  const dow = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - dow + (dow === 0 ? -6 : 1));

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function slotKey(date, hour) {
  const d = new Date(date);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function isToday(date) {
  const now = new Date();
  return date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
}

export default function TacticalCalendar({ games, calendar, onCalendarChange, wishlist }) {
  const { push } = useToast();
  const [picker, setPicker] = useState(null); // { key, date, hour }
  const [pickerGame, setPickerGame] = useState('');

  const days = useMemo(() => getWeekDays(), []);

  const backlogGames = games.filter(g => g.status !== 'finished');

  // Wishlists with release dates as calendar events
  const releaseEvents = useMemo(() => {
    const map = {};
    wishlist?.forEach(w => {
      if (!w.releaseDate) return;
      const d = new Date(w.releaseDate);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      map[key] = w;
    });
    return map;
  }, [wishlist]);

  function openPicker(day, hour) {
    const key = slotKey(day, hour);
    setPicker({ key, day, hour });
    const existing = calendar[key];
    setPickerGame(existing ? String(existing.gameId) : '');
  }

  function saveSlot() {
    if (!picker) return;
    const updated = { ...calendar };
    if (pickerGame) {
      updated[picker.key] = { gameId: Number(pickerGame), duration: 60 };
      const game = games.find(g => g.id === Number(pickerGame));
      if (game) {
        push('saved', `✓ "${game.title}" agendado para as ${picker.hour}h`, 3000);
      }
    } else {
      delete updated[picker.key]; // clear slot
    }
    onCalendarChange(updated);
    setPicker(null);
  }

  function clearSlot(key) {
    const updated = { ...calendar };
    delete updated[key];
    onCalendarChange(updated);
  }

  function dayReleaseKey(day) {
    return `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Calendário Tático</div>
          <div className="page-subtitle">AGENDAMENTO DE SESSÕES — SEMANA ATUAL</div>
        </div>
        <div className="page-actions" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--green-bright)' }}>●</span>&nbsp;
          {Object.keys(calendar).length} sessão(ões) agendada(s)
        </div>
      </div>

      <div style={{ padding: '20px 28px' }}>
        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, background: 'var(--accent-dim)', border: '1px solid var(--accent)', display: 'inline-block' }} />
            Sessão agendada
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, background: 'var(--green-dim)', border: '1px solid var(--green-bright)', display: 'inline-block' }} />
            Lançamento da Wishlist
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, background: 'var(--bg-elevated)', border: '1px solid var(--accent)', display: 'inline-block' }} />
            Hoje
          </span>
        </div>

        {/* Calendar Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '48px repeat(7, 1fr)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
        }}>
          {/* Header Row */}
          <div style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', padding: '8px 0' }} />
          {days.map((day, i) => {
            const release = releaseEvents[dayReleaseKey(day)];
            const today = isToday(day);
            return (
              <div key={i} style={{
                background: today ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                borderBottom: '1px solid var(--border)',
                borderLeft: '1px solid var(--border)',
                padding: '8px 6px',
                textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10, color: today ? 'var(--accent)' : 'var(--text-muted)',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                }}>
                  {DAYS_PT[day.getDay()]}
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700,
                  color: today ? 'var(--accent)' : 'var(--text-primary)', marginTop: 2,
                }}>
                  {day.getDate()}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
                  {MONTHS_PT[day.getMonth()]}
                </div>
                {release && (
                  <div style={{
                    marginTop: 4, fontSize: 9, fontFamily: 'var(--font-mono)',
                    color: 'var(--green-bright)', border: '1px solid var(--green-border)',
                    background: 'var(--green-dim)', padding: '2px 4px', borderRadius: 1,
                  }}>
                    🚀 {release.emoji}
                  </div>
                )}
              </div>
            );
          })}

          {/* Time Slot Rows */}
          {HOUR_SLOTS.map(hour => (
            <>
              {/* Hour label */}
              <div key={`h-${hour}`} style={{
                background: 'var(--bg-card)',
                borderTop: '1px solid var(--border)',
                padding: '10px 4px',
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {hour}h
              </div>

              {/* Day cells */}
              {days.map((day, di) => {
                const key = slotKey(day, hour);
                const entry = calendar[key];
                const game  = entry ? games.find(g => g.id === entry.gameId) : null;
                const today = isToday(day);

                return (
                  <div
                    key={`${hour}-${di}`}
                    onClick={() => openPicker(day, hour)}
                    style={{
                      borderTop: '1px solid var(--border)',
                      borderLeft: '1px solid var(--border)',
                      minHeight: 52,
                      padding: 5,
                      cursor: 'pointer',
                      background: entry
                        ? 'var(--accent-dim)'
                        : today
                          ? 'rgba(255,79,0,0.03)'
                          : 'var(--bg-card)',
                      transition: 'background 80ms ease',
                      position: 'relative',
                    }}
                    onMouseEnter={e => { if (!entry) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                    onMouseLeave={e => { if (!entry) e.currentTarget.style.background = today ? 'rgba(255,79,0,0.03)' : 'var(--bg-card)'; }}
                  >
                    {game ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', lineHeight: 1.3 }}>
                          {game.emoji} {game.title.length > 12 ? game.title.slice(0, 12) + '…' : game.title}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
                          1h · {game.genre}
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); clearSlot(key); }}
                          style={{
                            position: 'absolute', top: 3, right: 3,
                            background: 'none', border: 'none',
                            color: 'var(--text-muted)', fontSize: 9,
                            cursor: 'pointer', padding: '1px 3px',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div style={{
                        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-muted)', fontSize: 16, opacity: 0.15,
                      }}>
                        +
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          ))}
        </div>

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
          {Object.entries(calendar).slice(0, 4).map(([key, entry]) => {
            const game = games.find(g => g.id === entry.gameId);
            if (!game) return null;
            const dt = new Date(key);
            return (
              <div key={key} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px',
                background: 'var(--bg-card)',
                border: '1px solid var(--accent-border)',
                borderRadius: 2,
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text-secondary)',
              }}>
                <span>{game.emoji}</span>
                <span>{game.title.slice(0, 14)}</span>
                <span style={{ color: 'var(--accent)' }}>
                  {DAYS_PT[dt.getDay()]} {dt.getDate()}/{MONTHS_PT[dt.getMonth()]} às {dt.getHours()}h
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Slot Picker Modal */}
      {picker && (
        <div
          className="modal-overlay"
          onClick={() => setPicker(null)}
        >
          <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <span className="modal-tag">AGENDAR</span>
                {DAYS_PT[picker.day.getDay()]}, {picker.day.getDate()} às {picker.hour}h
              </div>
              <button className="modal-close" onClick={() => setPicker(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">SELECIONAR JOGO</label>
                <select
                  className="form-select"
                  value={pickerGame}
                  onChange={e => setPickerGame(e.target.value)}
                  autoFocus
                >
                  <option value="">— Sem jogo (limpar slot) —</option>
                  {backlogGames.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.emoji} {g.title} · {g.ttbMain}h · {g.genre}
                    </option>
                  ))}
                </select>
              </div>
              {pickerGame && (() => {
                const g = games.find(g => g.id === Number(pickerGame));
                if (!g) return null;
                return (
                  <div style={{
                    padding: '10px 12px', background: 'var(--bg-root)',
                    border: '1px solid var(--border)', borderRadius: 2,
                    fontFamily: 'var(--font-mono)', fontSize: 11,
                    color: 'var(--text-secondary)', lineHeight: 1.8,
                  }}>
                    <div><span style={{ color: 'var(--accent)' }}>HLTB:</span> {g.ttbMain}h main / {g.ttbFull}h 100%</div>
                    <div><span style={{ color: 'var(--accent)' }}>Metacritic:</span> {g.metacritic}/100</div>
                    <div><span style={{ color: 'var(--accent)' }}>Gênero:</span> {g.genre}</div>
                  </div>
                );
              })()}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setPicker(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveSlot}>
                {pickerGame ? '+ Agendar Sessão' : '✕ Limpar Slot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
