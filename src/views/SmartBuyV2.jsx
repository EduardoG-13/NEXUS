// ============================================================
// SMART BUY V2 — Inteligência de Mercado
// Grid de oportunidades + ROI badge + Menor Preço Histórico
// ============================================================
import { useState, useMemo } from 'react';
import { computeROI } from '../data';

const SORT_OPTIONS = [
  { id: 'roi',   label: 'Melhor ROI' },
  { id: 'price', label: 'Menor Preço' },
  { id: 'mc',    label: 'Metacritic' },
];

function cphColor(cph) {
  if (cph === null) return 'var(--text-muted)';
  if (cph <= 3) return 'var(--green-bright)';
  if (cph <= 7) return 'var(--yellow)';
  return 'var(--red)';
}

function verdict(cph, isFree) {
  if (isFree) return { icon: '✅', text: '∞ ROI — Custo zero.' };
  if (cph === null) return { icon: '⏳', text: 'Dados insuficientes' };
  if (cph <= 3) return { icon: '✅', text: 'ROI excelente — Compra estratégica' };
  if (cph <= 7) return { icon: '🟡', text: 'ROI razoável — Aguarde promoção' };
  return { icon: '🔴', text: 'ROI fraco — Espere -40%' };
}

function CountdownWidget({ items }) {
  const upcoming = items
    .filter(w => w.releaseDate)
    .map(w => {
      const diff = new Date(w.releaseDate) - new Date();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return { ...w, daysLeft: days };
    })
    .filter(w => w.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  if (upcoming.length === 0) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      <div className="section-hd" style={{ marginBottom: 12 }}>LANÇAMENTOS DA WISHLIST</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {upcoming.map(w => (
          <div key={w.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderLeft: `2px solid ${w.daysLeft <= 30 ? 'var(--accent)' : 'var(--border-hi)'}`,
            borderRadius: 'var(--radius)',
            minWidth: 200,
          }}>
            <div style={{
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
              minWidth: 48,
            }}>
              <div style={{
                fontSize: 22, fontWeight: 700,
                color: w.daysLeft <= 30 ? 'var(--accent)' : 'var(--text-primary)',
              }}>
                {w.daysLeft}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>DIAS</div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{w.emoji} {w.title}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                {new Date(w.releaseDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SmartBuyV2({ wishlist }) {
  const [sortBy, setSortBy] = useState('roi');
  const [view,   setView]   = useState('market'); // 'market' | 'wishlist'

  const market = useMemo(() => {
    return [...wishlist]
      .filter(g => !g.unreleased && g.currentPrice != null)
      .map(g => ({
        ...g,
        cph: g.isFree ? 0 : computeROI(g.currentPrice, g.ttbMain),
        savings: g.historicLow != null ? (g.currentPrice - g.historicLow) : null,
      }))
      .sort((a, b) => {
        if (sortBy === 'roi')   return (a.cph ?? 999) - (b.cph ?? 999);
        if (sortBy === 'price') return (a.currentPrice ?? 999) - (b.currentPrice ?? 999);
        return (b.rating ?? 0) - (a.rating ?? 0);
      });
  }, [wishlist, sortBy]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Compra Inteligente</div>
          <div className="page-subtitle">ROI DE LAZER — CUSTO POR HORA DE DIVERSÃO</div>
        </div>
        <div className="page-actions">
          <button
            className={`chip ${view === 'market' ? 'active' : ''}`}
            onClick={() => setView('market')}
          >
            📊 Mercado
          </button>
          <button
            className={`chip ${view === 'wishlist' ? 'active' : ''}`}
            onClick={() => setView('wishlist')}
          >
            ⭐ Wishlist
          </button>
        </div>
      </div>

      <div style={{ padding: '20px 28px' }}>
        {/* Launch Countdown */}
        <CountdownWidget items={wishlist} />

        {view === 'market' && (
          <>
            {/* Sort */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>ORDENAR:</span>
              {SORT_OPTIONS.map(s => (
                <button
                  key={s.id}
                  className={`chip ${sortBy === s.id ? 'active' : ''}`}
                  onClick={() => setSortBy(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* ROI Benchmark */}
            <div style={{
              padding: '10px 14px', marginBottom: 16,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderLeft: '2px solid var(--accent)',
              borderRadius: 'var(--radius)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 14 }}>💡</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>
                  Custo/Hora de Lazer = Preço ÷ Horas HLTB
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                  {`R$3/h `}{`= Excelente`}&nbsp;·&nbsp;{`R$3–7/h = Razoável`}&nbsp;·&nbsp;{`> R$7/h = Ineficiente`}&nbsp;·&nbsp;Netflix ≈ R$1,80/h
                </div>
              </div>
            </div>

            {/* Market Grid */}
            <div className="wishlist-grid">
              {market.map(game => {
                const v = verdict(game.cph, game.isFree);
                const cc = cphColor(game.cph);
                const isHistLow = game.isHistLow || (game.historicLow && game.currentPrice <= game.historicLow);

                return (
                  <div className="wl-card" key={game.id} style={{
                    backgroundImage: game.cover ? `url(${game.cover})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                  }}>
                    {/* Cover overlay */}
                    {game.cover && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(10,10,10,0.88)',
                        borderRadius: 'var(--radius)',
                      }} />
                    )}
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      {isHistLow && <div className="hist-low">⬇ MÍN. HISTÓRICO</div>}

                      <div className="wl-head">
                        <div className="wl-ico">{game.emoji}</div>
                        <div style={{ flex: 1 }}>
                          <div className="wl-title">{game.title}</div>
                          <div className="wl-genre">{game.genre}</div>
                        </div>
                      </div>

                      <div className="roi-row">
                        <div className="roi-cell">
                          <div className="roi-cell-label">PREÇO ATUAL</div>
                          <div className="roi-cell-val" style={{ color: isHistLow ? 'var(--green-bright)' : 'var(--text-primary)' }}>
                            {game.isFree ? 'GRÁTIS' : `R$${game.currentPrice?.toFixed(0)}`}
                          </div>
                        </div>
                        <div className="roi-cell">
                          <div className="roi-cell-label">DURAÇÃO</div>
                          <div className="roi-cell-val">{game.ttbMain}h</div>
                        </div>
                        <div className="roi-cell">
                          <div className="roi-cell-label">METACRITIC</div>
                          <div className="roi-cell-val" style={{
                            color: game.rating >= 90 ? 'var(--green-bright)' : game.rating >= 75 ? 'var(--yellow)' : 'var(--text-muted)',
                          }}>
                            {game.rating ?? '—'}
                          </div>
                        </div>
                      </div>

                      <div className="cph-row">
                        <div className="cph-label">CUSTO / HORA</div>
                        <div className="cph-val" style={{ color: cc }}>
                          {game.isFree ? 'R$ 0,00 / h' : game.cph != null ? `R$ ${game.cph.toFixed(2)} / h` : '—'}
                        </div>
                      </div>

                      <div className="roi-verdict">{v.icon} <span>{v.text}</span></div>

                      {game.historicLow != null && !isHistLow && (
                        <div className="hist-note">
                          <span>Mín. histórico:</span>
                          <span style={{ color: 'var(--green-bright)' }}>R${game.historicLow.toFixed(0)}</span>
                        </div>
                      )}

                      <div className="wl-actions">
                        <button className="btn">🛒 Comprar</button>
                        <button className="btn btn-ghost">🔔 Alertar</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {view === 'wishlist' && (
          <WishlistPanel wishlist={wishlist} />
        )}

        <div style={{ height: 28 }} />
      </div>
    </div>
  );
}

function WishlistPanel({ wishlist }) {
  return (
    <div>
      <div className="section-hd" style={{ marginBottom: 12 }}>LISTA DE DESEJOS</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {wishlist.map(w => {
          const isRecommended = w.isHistLow || (w.historicLow && w.currentPrice <= w.historicLow);
          const cph = w.isFree ? 0 : computeROI(w.currentPrice, w.ttbMain);

          return (
            <div key={w.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 14px',
              background: 'var(--bg-card)',
              border: `1px solid ${isRecommended ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)',
              position: 'relative',
              animation: isRecommended ? 'wishlist-pulse 2s ease infinite' : 'none',
            }}>
              {isRecommended && (
                <div style={{
                  position: 'absolute', top: -1, right: 10,
                  fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                  color: 'var(--accent)', letterSpacing: '0.1em',
                  background: 'var(--bg-card)', padding: '2px 6px',
                  border: '1px solid var(--accent)', borderTop: 'none',
                }}>
                  ⚡ COMPRA RECOMENDADA
                </div>
              )}
              <div style={{ fontSize: 20 }}>{w.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{w.title}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                  {w.genre} · {w.ttbMain}h main
                  {w.releaseDate ? ` · 🚀 ${new Date(w.releaseDate).toLocaleDateString('pt-BR')}` : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: isRecommended ? 'var(--green-bright)' : 'var(--text-primary)' }}>
                  {w.isFree ? 'GRÁTIS' : w.currentPrice ? `R$${w.currentPrice.toFixed(0)}` : w.unreleased ? 'A LANÇAR' : '—'}
                </div>
                {cph != null && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: cph <= 3 ? 'var(--green-bright)' : cph <= 7 ? 'var(--yellow)' : 'var(--red)' }}>
                    R${cph.toFixed(2)}/h
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                <button className="btn btn-ghost" style={{ fontSize: 11 }}>🔔</button>
                {w.currentPrice && <button className="btn" style={{ fontSize: 11 }}>🛒</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
