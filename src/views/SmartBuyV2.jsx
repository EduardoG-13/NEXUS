// ============================================================
// SMART BUY V3 — Loja Inteligente
// Aba 1: ROI da Biblioteca (jogos do usuário)
// Aba 2: Recomendações (curada por gênero + ROI)
// Images 25% menores vs versão anterior
// ============================================================
import { useState, useMemo, useEffect } from 'react';
import { computeROI } from '../data';
import { getTopDeals } from '../services/cheapSharkService';
import { curateOffers } from '../services/groqService';

// (Removido CATALOG estático)

// Seed generator para rotacionar jogos baseados no dia
function getDailySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function steamImg(appId) {
  return `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`;
}

function cphColor(cph) {
  if (cph == null) return 'var(--text-muted)';
  if (cph <= 3)   return 'var(--green-bright)';
  if (cph <= 7)   return 'var(--yellow)';
  return 'var(--red)';
}

function verdict(cph) {
  if (cph == null) return { icon: '⏳', text: 'Sem preço — adicione manualmente' };
  if (cph <= 2)    return { icon: '✅', text: 'ROI excelente — Compra estratégica' };
  if (cph <= 5)    return { icon: '🟡', text: 'ROI razoável — Aguarde promoção' };
  return            { icon: '🔴', text: 'ROI fraco — Espere desconto' };
}

// ── Card de jogo pequeno ────────────────────────────────────
function GameCard({ title, cover, genre, ttbMain, price, pricePaid, mc, steamAppId, source }) {
  const cph    = computeROI(price ?? pricePaid, ttbMain);
  const v      = verdict(cph);
  const imgSrc = cover ?? (steamAppId ? steamImg(steamAppId) : null);

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Imagem 25% menor: 147px × 69px (antes ~195×92) */}
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={title}
          style={{ width: '100%', height: 69, objectFit: 'cover', display: 'block', borderBottom: '1px solid var(--border)' }}
          onError={e => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div style={{ height: 69, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, borderBottom: '1px solid var(--border)' }}>
          🎮
        </div>
      )}

      <div style={{ padding: '10px 10px 8px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Título + Gênero */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
            {title.length > 22 ? title.slice(0, 22) + '…' : title}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
            {genre ?? 'Steam'}{ttbMain ? ` · ${ttbMain}h` : ''}
            {mc ? ` · MC:${mc}` : ''}
          </div>
        </div>

        {/* Preço + CPH */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            {(price ?? pricePaid) != null ? `R$${(price ?? pricePaid).toFixed(0)}` : <span style={{ color: 'var(--yellow)' }}>R$--</span>}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: cphColor(cph) }}>
            {cph != null ? `R$${cph.toFixed(2)}/h` : '-- /h'}
          </div>
        </div>

        {/* Veredito */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)', borderTop: '1px solid var(--border)', paddingTop: 6 }}>
          {v.icon} {v.text}
        </div>

        {/* Link SteamDB */}
        {steamAppId && (
          <a
            href={`https://steamdb.info/app/${steamAppId}/`}
            target="_blank"
            rel="noreferrer"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)', marginTop: 2 }}
          >
            → SteamDB
          </a>
        )}
      </div>
    </div>
  );
}

// ── Componente principal ────────────────────────────────────
export default function SmartBuyV2({ games = [], wishlist = [] }) {
  const [tab, setTab] = useState('library');
  const [aiRecs, setAiRecs] = useState([]);
  const [loadingTopDeals, setLoadingTopDeals] = useState(false);

  // Biblioteca do usuário com ROI calculado
  const libraryWithROI = useMemo(() =>
    [...games]
      .map(g => ({
        ...g,
        cph: computeROI(g.pricePaid ?? g.price, g.ttbMain),
      }))
      .sort((a, b) => (a.cph ?? 999) - (b.cph ?? 999)),
    [games]
  );

  async function fetchCuratedDeals() {
    setLoadingTopDeals(true);
    try {
      const deals = await getTopDeals();
      const curated = await curateOffers(games, deals);
      setAiRecs(curated.map(r => ({ ...r, cph: computeROI(r.price, 20) }))); // Assumindo media 20h para ROI inicial
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTopDeals(false);
    }
  }

  useEffect(() => {
    if (tab === 'recs' && aiRecs.length === 0) {
      fetchCuratedDeals();
    }
  }, [tab]);

  const TABS = [
    { id: 'library',  label: '◈ Minha Biblioteca', count: libraryWithROI.length },
    { id: 'recs',     label: '↗ Loja Oculta (Oráculo)', count: aiRecs.length },
  ];

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))',
    gap: 10,
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Compra Inteligente</div>
          <div className="page-subtitle">ROI DE LAZER — CUSTO POR HORA DE DIVERSÃO</div>
        </div>
      </div>

      <div style={{ padding: '20px 28px' }}>
        {/* Benchmark bar */}
        <div style={{
          padding: '9px 14px', marginBottom: 16,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderLeft: '2px solid var(--accent)',
          fontFamily: 'var(--font-mono)', fontSize: 10,
          display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap',
          color: 'var(--text-secondary)',
        }}>
          <span style={{ color: 'var(--accent)' }}>// BENCHMARK</span>
          <span><span style={{ color: 'var(--green-bright)' }}>≤R$3/h</span> = Excelente</span>
          <span><span style={{ color: 'var(--yellow)' }}>R$3–7/h</span> = Razoável</span>
          <span><span style={{ color: 'var(--red)' }}>&gt;R$7/h</span> = Ineficiente</span>
          <span style={{ color: 'var(--text-muted)' }}>Netflix ≈ R$1,80/h</span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              className={`chip ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.count > 0 && (
                <span style={{
                  marginLeft: 5, fontFamily: 'var(--font-mono)', fontSize: 9,
                  background: 'var(--bg-root)', padding: '1px 5px',
                }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Aba: Minha Biblioteca */}
        {tab === 'library' && (
          libraryWithROI.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '60px 20px',
              fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: 11,
            }}>
              [BIBLIOTECA VAZIA]<br />
              <span style={{ fontSize: 10, marginTop: 8, display: 'block' }}>
                // Sincronize a Steam para ver sua biblioteca com análise de ROI
              </span>
            </div>
          ) : (
            <div style={gridStyle}>
              {libraryWithROI.map(g => (
                <GameCard key={g.id} {...g} price={g.pricePaid ?? g.price} />
              ))}
            </div>
          )
        )}

        {/* Aba: Recomendações */}
        {tab === 'recs' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)' }}>
                // Rotação NEXUS · Curadoria de IA baseada na sua biblioteca Steam e descontos atuais (CheapShark API)
              </div>
              <button
                onClick={fetchCuratedDeals}
                className="btn btn-ghost"
                disabled={loadingTopDeals}
                style={{ fontSize: 10, padding: '4px 10px' }}
              >
                {loadingTopDeals ? '↻ Curando...' : '↻ Atualizar Curadoria'}
              </button>
            </div>
            
            {loadingTopDeals ? (
              <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                <span className="dot-live" style={{ background: 'var(--accent)' }}></span> O Oráculo está analisando as promoções...
              </div>
            ) : (
              <div style={gridStyle}>
                {aiRecs.map(r => (
                  <GameCard
                    key={r.appId || Math.random()}
                    title={r.title}
                    cover={r.thumb || steamImg(r.appId)}
                    genre="Steam Deal"
                    price={r.price}
                    mc={r.mc}
                    steamAppId={r.appId}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ height: 28 }} />
      </div>
    </div>
  );
}
