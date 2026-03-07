import { useState, useMemo } from 'react';
import { WISHLIST, computeROI } from '../data';

const SORT_OPTIONS = [
  { id: 'roi',   label: 'Melhor ROI' },
  { id: 'price', label: 'Menor Preço' },
  { id: 'ttb',   label: 'Mais Longo' },
];

function cphColor(cph) {
  if (cph === null || cph === undefined) return 'var(--text-muted)';
  if (cph <= 3) return 'var(--green-bright)';
  if (cph <= 7) return 'var(--yellow)';
  return 'var(--red)';
}

function verdict(cph, isFree) {
  if (isFree) return { icon: '✅', text: '∞ ROI — Investimento zero.' };
  if (cph === null) return { icon: '⏳', text: 'Sem dados suficientes' };
  if (cph <= 3) return { icon: '✅', text: 'Excelente ROI — Compra estratégica' };
  if (cph <= 7) return { icon: '🟡', text: 'ROI razoável — Aguarde promoção' };
  return { icon: '🔴', text: 'ROI fraco — Aguarde desconto de 40%+' };
}

export default function SmartBuy() {
  const [sortBy, setSortBy] = useState('roi');

  const items = useMemo(() => {
    return WISHLIST
      .map(g => ({ ...g, cph: g.isFree ? 0 : computeROI(g.price, g.ttbMain) }))
      .sort((a, b) => {
        if (sortBy === 'roi') {
          if (a.unreleased) return 1;
          if (b.unreleased) return -1;
          if (a.cph === null) return 1;
          if (b.cph === null) return -1;
          return a.cph - b.cph;
        }
        if (sortBy === 'price') return (a.price ?? 9999) - (b.price ?? 9999);
        return b.ttbMain - a.ttbMain;
      });
  }, [sortBy]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Smart Buy</div>
          <div className="page-subtitle">ROI DE DIVERSÃO — CALCULADORA DE EFICIÊNCIA FINANCEIRA</div>
        </div>
        <div className="page-actions">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>SORT:</span>
          {SORT_OPTIONS.map(s => (
            <button
              key={s.id}
              className={`chip ${sortBy === s.id ? 'active' : ''}`}
              onClick={() => setSortBy(s.id)}
              id={`sort-${s.id}`}
            >
              {s.label}
            </button>
          ))}
          <button className="btn btn-primary">+ Wishlist</button>
        </div>
      </div>

      <div style={{ padding: '0 28px' }}>
        {/* Formula Banner */}
        <div style={{
          margin: '18px 0',
          padding: '12px 16px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderLeft: '2px solid var(--accent)',
          borderRadius: 'var(--radius)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}>
          <span style={{ fontSize: 16 }}>💡</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>
              Custo por Hora de Diversão (CPH) = Preço ÷ Horas Estimadas (HLTB)
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
              CPH ≤ R$3/h = Excelente &nbsp;·&nbsp; R$3–7/h = Razoável &nbsp;·&nbsp; &gt; R$7/h = Ineficiente &nbsp;·&nbsp; Netflix ≈ R$1,80/h
            </div>
          </div>
        </div>

        {/* Wishlist Grid */}
        <div className="wishlist-grid">
          {items.map(game => {
            const v = verdict(game.cph, game.isFree);
            const cc = game.isFree ? 'var(--green-bright)' : cphColor(game.cph);

            return (
              <div className="wl-card" key={game.id}>
                {game.isHistLow && !game.unreleased && (
                  <div className="hist-low">⬇ MÍN. HISTÓRICO</div>
                )}

                <div className="wl-head">
                  <div className="wl-ico">{game.emoji}</div>
                  <div style={{ flex: 1, paddingRight: game.isHistLow ? '80px' : 0 }}>
                    <div className="wl-title">{game.title}</div>
                    <div className="wl-genre">{game.genre}</div>
                  </div>
                </div>

                {game.unreleased ? (
                  <div style={{
                    padding: '18px',
                    textAlign: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    background: 'var(--bg-root)',
                    border: '1px solid var(--border)',
                    borderRadius: 2,
                  }}>
                    ⏳ AINDA NÃO LANÇADO — Preço estimado: R$199–249
                  </div>
                ) : (
                  <>
                    <div className="roi-row">
                      <div className="roi-cell">
                        <div className="roi-cell-label">PREÇO</div>
                        <div className="roi-cell-val" style={{ color: game.isFree ? 'var(--green-bright)' : 'var(--text-primary)' }}>
                          {game.isFree ? 'GRÁTIS' : `R$${game.price?.toFixed(0) ?? '—'}`}
                        </div>
                      </div>
                      <div className="roi-cell">
                        <div className="roi-cell-label">DURAÇÃO</div>
                        <div className="roi-cell-val">{game.ttbMain}h</div>
                      </div>
                      <div className="roi-cell">
                        <div className="roi-cell-label">METACRITIC</div>
                        <div className="roi-cell-val" style={{
                          color: game.rating >= 90 ? 'var(--green-bright)'
                               : game.rating >= 75 ? 'var(--yellow)'
                               : 'var(--text-muted)'
                        }}>
                          {game.rating ?? '—'}
                        </div>
                      </div>
                    </div>

                    <div className="cph-row">
                      <div className="cph-label">CUSTO / HORA</div>
                      <div className="cph-val" style={{ color: cc }}>
                        {game.isFree
                          ? 'R$ 0,00 / h'
                          : game.cph !== null
                            ? `R$ ${game.cph.toFixed(2)} / h`
                            : '—'}
                      </div>
                    </div>

                    <div className="roi-verdict">{v.icon} <span>{v.text}</span></div>

                    {!game.isHistLow && game.histLow != null && (
                      <div className="hist-note">
                        <span>Mín. histórico:</span>
                        <span style={{ color: 'var(--green-bright)' }}>R${game.histLow.toFixed(0)}</span>
                      </div>
                    )}

                    <div className="wl-actions">
                      <button className="btn">🛒 Comprar</button>
                      <button className="btn btn-ghost">🔔 Alertar</button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ height: 28 }} />
      </div>
    </div>
  );
}
