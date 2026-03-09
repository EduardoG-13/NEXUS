// ============================================================
// TACTICAL CALENDAR V5 — Fix gameId string/number + rich session display
// ============================================================
import React, { useState, useMemo } from 'react';
import { useToast } from '../components/ToastSystem';

const HOUR_SLOTS = [18, 19, 20, 21, 22];
const DAYS_PT   = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function getWeekDays() {
  const today = new Date();
  const dow   = today.getDay();
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

// Lookup flexível: aceita gameId numérico OU string (steam_XXXXX)
function findGame(games, gameId) {
  if (gameId === undefined || gameId === null || gameId === '') return null;
  return games.find(g => String(g.id) === String(gameId)) ?? null;
}

export default function TacticalCalendar({ games, calendar, onCalendarChange, wishlist }) {
  const { push } = useToast();
  const [picker, setPicker]       = useState(null);
  const [pickerGame, setPickerGame] = useState('');

  const days = useMemo(() => getWeekDays(), []);
  const backlogGames = games.filter(g => g.status !== 'finished');

  const releaseEvents = useMemo(() => {
    const map = {};
    wishlist?.forEach(w => {
      if (!w.releaseDate) return;
      const d = new Date(w.releaseDate);
      map[`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`] = w;
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
      // Salva gameId como string para compatibilidade com IDs Steam
      updated[picker.key] = { gameId: pickerGame, duration: 60 };
      const game = findGame(games, pickerGame);
      if (game) push('saved', `✓ "${game.title}" agendado para as ${picker.hour}h`, 3000);
    } else {
      delete updated[picker.key];
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

  const upcomingSessions = Object.entries(calendar)
    .map(([k, v]) => ({ key: k, time: new Date(k), ...v }))
    .filter(s => s.time >= new Date())
    .sort((a, b) => a.time - b.time);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Calendário Tático</div>
          <div className="page-subtitle">AGENDAMENTO DE SESSÕES — SEMANA ATUAL</div>
        </div>
        <div className="page-actions" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--green-bright)' }}>●</span>&nbsp;
          {upcomingSessions.length} sessão(ões) agendada(s)
        </div>
      </div>

      <div style={{ padding: '20px 28px' }}>
        {/* Legenda */}
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
            <span style={{ width: 10, height: 10, background: 'var(--accent-dim)', border: '1px solid var(--accent)', display: 'inline-block' }} />
            Hoje
          </span>
        </div>

        {/* Aviso se biblioteca vazia */}
        {games.length === 0 && (
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--yellow)',
            border: '1px solid var(--yellow-border)', background: 'var(--yellow-dim)',
            padding: '10px 14px', marginBottom: 16,
          }}>
            ! Biblioteca vazia — sincronize a Steam para agendar sessões.
          </div>
        )}

        {/* Grade */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '48px repeat(7, 1fr)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}>
          {/* Cabeçalho */}
          <div style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', padding: '8px 0' }} />
          {days.map((day, i) => {
            const release = releaseEvents[dayReleaseKey(day)];
            const today   = isToday(day);
            return (
              <div key={i} style={{
                background: today ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                borderBottom: '1px solid var(--border)',
                borderLeft: '1px solid var(--border)',
                padding: '8px 6px',
                textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  color: today ? 'var(--accent)' : 'var(--text-muted)',
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
                    background: 'var(--green-dim)', padding: '2px 4px',
                  }}>
                    🚀 {release.emoji}
                  </div>
                )}
              </div>
            );
          })}

          {/* Linhas de horário */}
          {HOUR_SLOTS.map(hour => (
            <React.Fragment key={`row-${hour}`}>
              <div key={`h-${hour}`} style={{
                background: 'var(--bg-card)',
                borderTop: '1px solid var(--border)',
                padding: '10px 4px', textAlign: 'center',
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {hour}h
              </div>

              {days.map((day, di) => {
                const key   = slotKey(day, hour);
                const entry = calendar[key];
                const game  = entry ? findGame(games, entry.gameId) : null;
                const today = isToday(day);

                return (
                  <div
                    key={`${hour}-${di}`}
                    onClick={() => openPicker(day, hour)}
                    style={{
                      borderTop: '1px solid var(--border)',
                      borderLeft: '1px solid var(--border)',
                      minHeight: 56,
                      padding: 5,
                      cursor: 'pointer',
                      background: entry
                        ? 'var(--accent-dim)'
                        : today
                          ? 'rgba(255,140,0,0.03)'
                          : 'var(--bg-card)',
                      transition: 'background 80ms ease',
                      position: 'relative',
                    }}
                    onMouseEnter={e => { if (!entry) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                    onMouseLeave={e => { if (!entry) e.currentTarget.style.background = today ? 'rgba(255,140,0,0.03)' : 'var(--bg-card)'; }}
                  >
                    {game ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* HORÁRIO em destaque */}
                        <div style={{
                          fontFamily: 'var(--font-mono)', fontSize: 9,
                          color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.08em',
                        }}>
                          {hour}:00h
                        </div>
                        {/* EMOJI + NOME */}
                        <div style={{
                          fontSize: 11, fontWeight: 600,
                          color: 'var(--text-primary)', lineHeight: 1.3,
                        }}>
                          {game.emoji} {game.title.length > 11 ? game.title.slice(0, 11) + '…' : game.title}
                        </div>
                        {/* DURAÇÃO + GÊNERO */}
                        <div style={{
                          fontFamily: 'var(--font-mono)', fontSize: 9,
                          color: 'var(--text-muted)',
                        }}>
                          1h · {game.genre ?? 'Steam'}
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); clearSlot(key); }}
                          style={{
                            position: 'absolute', top: 3, right: 3,
                            background: 'none', border: 'none',
                            color: 'var(--text-muted)', fontSize: 9,
                            cursor: 'pointer', padding: '1px 3px',
                          }}
                        >✕</button>
                      </div>
                    ) : (
                      <div style={{
                        height: '100%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-muted)', fontSize: 16, opacity: 0.12,
                      }}>
                        +
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Lista de próximas sessões */}
        {upcomingSessions.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 9,
              color: 'var(--text-muted)', letterSpacing: '0.12em',
              marginBottom: 8, textTransform: 'uppercase',
            }}>
              // PRÓXIMAS SESSÕES
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {upcomingSessions.slice(0, 5).map(({ key, time, gameId }) => {
                const game = findGame(games, gameId);
                if (!game) return null;
                return (
                  <div key={key} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--accent-border)',
                    fontFamily: 'var(--font-mono)', fontSize: 10,
                    color: 'var(--text-secondary)',
                  }}>
                    <span style={{ fontSize: 14 }}>{game.emoji}</span>
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{game.title}</div>
                      <div style={{ color: 'var(--accent)', fontSize: 9 }}>
                        {DAYS_PT[time.getDay()]} {time.getDate()}/{MONTHS_PT[time.getMonth()]} · {time.getHours()}:00h
                      </div>
                    </div>
                    <button
                      onClick={() => clearSlot(key)}
                      style={{ marginLeft: 4, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 10, cursor: 'pointer' }}
                    >✕</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Agendamento */}
      {picker && (
        <div className="modal-overlay" onClick={() => setPicker(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <span className="modal-tag">AGENDAR</span>
                {DAYS_PT[picker.day.getDay()]}, {picker.day.getDate()}/{MONTHS_PT[picker.day.getMonth()]} às {picker.hour}:00h
              </div>
              <button className="modal-close" onClick={() => setPicker(null)}>✕</button>
            </div>
            <div className="modal-body">
              {backlogGames.length === 0 ? (
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11,
                  color: 'var(--yellow)', border: '1px solid var(--yellow-border)',
                  background: 'var(--yellow-dim)', padding: '12px',
                }}>
                  ! Nenhum jogo na biblioteca.<br />
                  Sincronize a Steam ou adicione um jogo manualmente.
                </div>
              ) : (
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
                      <option key={g.id} value={String(g.id)}>
                        {g.emoji} {g.title}{g.ttbMain ? ` · ${g.ttbMain}h` : ''} · {g.genre ?? 'Steam'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {pickerGame && (() => {
                const g = findGame(games, pickerGame);
                if (!g) return null;
                return (
                  <div style={{
                    padding: '10px 12px', background: 'var(--bg-root)',
                    border: '1px solid var(--border)',
                    fontFamily: 'var(--font-mono)', fontSize: 11,
                    color: 'var(--text-secondary)', lineHeight: 1.8, marginTop: 10,
                  }}>
                    <div><span style={{ color: 'var(--accent)' }}>JOGO:</span> {g.emoji} {g.title}</div>
                    <div><span style={{ color: 'var(--accent)' }}>HLTB:</span> {g.ttbMain ? `${g.ttbMain}h` : 'Pendente'}</div>
                    <div><span style={{ color: 'var(--accent)' }}>ROI:</span> {g.pricePaid && g.ttbMain ? `R$${(g.pricePaid/g.ttbMain).toFixed(2)}/h` : 'Pendente (adicione o preço)'}</div>
                    <div><span style={{ color: 'var(--accent)' }}>PLATAFORMA:</span> {g.platform}</div>
                    {g.steamAppId && (
                      <div>
                        <span style={{ color: 'var(--accent)' }}>STEAMDB:</span>{' '}
                        <a
                          href={`https://steamdb.info/app/${g.steamAppId}/`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--accent)', textDecoration: 'underline' }}
                        >
                          steamdb.info/app/{g.steamAppId}
                        </a>
                      </div>
                    )}
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
