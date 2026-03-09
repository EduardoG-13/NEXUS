// ============================================================
// SMART BUY V3 — Loja Inteligente
// Aba 1: ROI da Biblioteca (jogos do usuário)
// Aba 2: Recomendações (curada por gênero + ROI)
// Images 25% menores vs versão anterior
// ============================================================
import { useState, useMemo } from 'react';
import { computeROI } from '../data';

// ── Lista curada de jogos recomendados para compra ──────────
// Uma lista mais robusta para sortear recomendações diárias/rotativas
const CATALOG = [
  { id: 'r1',  title: 'Elden Ring',           appId: 1245620, genre: 'Action RPG',     price: 189.90, ttbMain: 55,  mc: 96  },
  { id: 'r2',  title: "Baldur's Gate 3",      appId: 1086940, genre: 'RPG',            price: 199.90, ttbMain: 100, mc: 96  },
  { id: 'r3',  title: 'Hollow Knight',        appId: 367520,  genre: 'Metroidvania',   price: 14.90,  ttbMain: 25,  mc: 90  },
  { id: 'r4',  title: 'Hades',                appId: 1145360, genre: 'Roguelike',      price: 34.90,  ttbMain: 22,  mc: 93  },
  { id: 'r5',  title: 'Disco Elysium',        appId: 632470,  genre: 'RPG',            price: 29.90,  ttbMain: 22,  mc: 91  },
  { id: 'r6',  title: 'Celeste',              appId: 504230,  genre: 'Plataforma',     price: 19.90,  ttbMain: 9,   mc: 94  },
  { id: 'r7',  title: 'Portal 2',             appId: 620,     genre: 'Puzzle',         price: 9.90,   ttbMain: 9,   mc: 95  },
  { id: 'r8',  title: 'Sekiro',               appId: 814380,  genre: 'Action',         price: 149.90, ttbMain: 30,  mc: 91  },
  { id: 'r9',  title: 'Cyberpunk 2077',       appId: 1091500, genre: 'Action RPG',     price: 89.90,  ttbMain: 28,  mc: 86  },
  { id: 'r10', title: 'Ori Will of Wisps',    appId: 1057090, genre: 'Metroidvania',   price: 39.90,  ttbMain: 9,   mc: 93  },
  { id: 'r11', title: 'Returnal',             appId: 1649240, genre: 'Roguelike',      price: 179.90, ttbMain: 25,  mc: 86  },
  { id: 'r12', title: 'God of War',           appId: 1593500, genre: 'Action',         price: 119.90, ttbMain: 21,  mc: 94  },
  { id: 'r13', title: 'Stardew Valley',       appId: 413150,  genre: 'Simulation',     price: 24.90,  ttbMain: 52,  mc: 89  },
  { id: 'r14', title: 'Terraria',             appId: 105600,  genre: 'Sandbox',        price: 19.90,  ttbMain: 50,  mc: 83  },
  { id: 'r15', title: 'Red Dead Redemption 2',appId: 1174180, genre: 'Open World',     price: 119.90, ttbMain: 50,  mc: 97  },
  { id: 'r16', title: 'Valheim',              appId: 892970,  genre: 'Survival',       price: 37.90,  ttbMain: 73,  mc: 0   },
  { id: 'r17', title: 'Dredge',               appId: 1562430, genre: 'Adventure',      price: 49.90,  ttbMain: 9,   mc: 80  },
  { id: 'r18', title: 'Slay the Spire',       appId: 646570,  genre: 'Deckbuilder',    price: 46.90,  ttbMain: 45,  mc: 89  },
];

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

  // Recomendações com ROI (Rotacionadas por Dia)
  const recsWithROI = useMemo(() => {
    // 1. Filtra jogos que o usuário VAZIO tem
    const notOwned = CATALOG.filter(r => !games.find(g => g.steamAppId === r.appId));
    
    // 2. Embaralha com uma seed baseada no dia + quantidade de jogos na biblioteca
    // Isso garante que se ele comprar algo novo, as recomendações dão um shuffle
    const seed = getDailySeed() + games.length;
    
    // Shuffle determinístico
    let shuffled = [...notOwned];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = (seed * (i + 1)) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // 3. Pega os top 6 ou 8 para não inundar e calcula CPH
    return shuffled
      .slice(0, 8)
      .map(r => ({ ...r, cph: computeROI(r.price, r.ttbMain) }))
      .sort((a, b) => (a.cph ?? 999) - (b.cph ?? 999));
  }, [games]);

  const TABS = [
    { id: 'library',  label: '◈ Minha Biblioteca', count: libraryWithROI.length },
    { id: 'recs',     label: '↗ Loja Oculta (Oráculo)', count: recsWithROI.length },
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
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)', marginBottom: 12 }}>
              // Rotação NEXUS diária · Filtro Ativo: Excluindo {games.length} jogos já possuídos
            </div>
            <div style={gridStyle}>
              {recsWithROI.map(r => (
                <GameCard
                  key={r.id}
                  title={r.title}
                  cover={steamImg(r.appId)}
                  genre={r.genre}
                  ttbMain={r.ttbMain}
                  price={r.price}
                  mc={r.mc}
                  steamAppId={r.appId}
                />
              ))}
            </div>
          </div>
        )}

        <div style={{ height: 28 }} />
      </div>
    </div>
  );
}
