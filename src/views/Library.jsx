import { useState, useMemo } from 'react';

const FILTERS = [
  { id: 'all',      label: 'Todos' },
  { id: 'short',    label: '< 10h' },
  { id: 'medium',   label: '10–30h' },
  { id: 'long',     label: '30–60h' },
  { id: 'epic',     label: '60h+' },
  { id: 'playing',  label: 'Jogando' },
  { id: 'backlog',  label: 'Backlog' },
  { id: 'finished', label: 'Finalizado' },
];

function matchFilter(game, filter) {
  if (filter === 'all')     return true;
  if (filter === 'short')   return game.ttbMain < 10;
  if (filter === 'medium')  return game.ttbMain >= 10 && game.ttbMain <= 30;
  if (filter === 'long')    return game.ttbMain > 30 && game.ttbMain <= 60;
  if (filter === 'epic')    return game.ttbMain > 60;
  return game.status === filter;
}

const PILL = { backlog: 's-backlog', playing: 's-playing', finished: 's-finished' };
const PILL_LBL = { backlog: 'BACKLOG', playing: 'JOGANDO', finished: 'FINALIZADO' };

export default function Library({ games, onBurn, onAddGame }) {
  const [filter,   setFilter]   = useState('all');
  const [search,   setSearch]   = useState('');
  const [burning,  setBurning]  = useState(new Set());
  const [burned,   setBurned]   = useState(new Set());

  const visible = useMemo(() => games.filter(g => {
    if (burned.has(g.id)) return false;
    if (!matchFilter(g, filter)) return false;
    if (search && !g.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [games, filter, search, burned]);

  function handleBurn(game) {
    if (burning.has(game.id) || burned.has(game.id)) return;
    setBurning(prev => new Set([...prev, game.id]));
    setTimeout(() => {
      setBurned(prev  => new Set([...prev, game.id]));
      setBurning(prev => { const s = new Set(prev); s.delete(game.id); return s; });
      onBurn?.(game.id);
    }, 500);
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Biblioteca</div>
          <div className="page-subtitle">GESTÃO DE BACKLOG — {games.length} TÍTULOS</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={onAddGame} id="btn-open-add-modal">
            + Adicionar Jogo
          </button>
        </div>
      </div>

      <div style={{ padding: '0 28px' }}>
        {/* Filter Row */}
        <div className="filter-row">
          <span className="filter-lbl">FILTRAR:</span>
          {FILTERS.map(f => (
            <button
              key={f.id}
              className={`chip ${filter === f.id ? 'active' : ''}`}
              onClick={() => setFilter(f.id)}
              id={`filter-${f.id}`}
            >
              {f.label}
            </button>
          ))}
          <input
            className="search-box"
            placeholder="buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="count-row">{visible.length} JOGOS ENCONTRADOS</div>

        {visible.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '60px 20px', gap: 8, textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, opacity: 0.3 }}>🕹️</div>
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Nenhum jogo encontrado</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ajuste os filtros ou adicione novos títulos.</div>
          </div>
        ) : (
          <table className="g-table">
            <thead>
              <tr>
                <th>JOGO</th>
                <th>GÊNERO</th>
                <th>TTB MAIN</th>
                <th>TTB 100%</th>
                <th>PREÇO</th>
                <th>MC</th>
                <th>STATUS</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map(game => (
                <tr
                  key={game.id}
                  className={`g-row ${burning.has(game.id) ? 'is-burning' : ''}`}
                >
                  <td>
                    <div className="g-title-wrap">
                      <div className="g-cover">{game.emoji}</div>
                      <div>
                        <div className="g-name">{game.title}</div>
                        <div className="g-platform">{game.platform}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{game.genre}</span>
                  </td>
                  <td><span className="g-mono">{game.ttbMain}h</span></td>
                  <td><span className="g-mono dim">{game.ttbFull}h</span></td>
                  <td><span className="g-mono dim">R${(game.pricePaid ?? game.price ?? 0).toFixed(0)}</span></td>
                  <td>
                    <span className="g-mono" style={{
                      color: game.metacritic >= 90 ? 'var(--green-bright)'
                           : game.metacritic >= 75 ? 'var(--yellow)'
                           : 'var(--text-secondary)'
                    }}>
                      {game.metacritic}
                    </span>
                  </td>
                  <td><span className={`s-pill ${PILL[game.status]}`}>{PILL_LBL[game.status]}</span></td>
                  <td>
                    <div className="actions-wrap">
                      {game.status !== 'finished' && (
                        <button className="btn btn-ghost" style={{ fontSize: 11, fontFamily: 'var(--font-mono)', padding: '4px 9px' }}>
                          ▶ Jogar
                        </button>
                      )}
                      {game.status === 'backlog' && (
                        <button
                          className="btn btn-danger"
                          onClick={() => handleBurn(game)}
                          title="Queime e libere carga mental"
                          id={`burn-${game.id}`}
                        >
                          🔥 BURN
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {burned.size > 0 && (
          <div className="burn-toast">
            🔥 {burned.size} {burned.size === 1 ? 'jogo queimado' : 'jogos queimados'}
            <span>— Carga mental liberada. Backlog Score +{burned.size * 5} pts.</span>
          </div>
        )}

        <div style={{ height: 28 }} />
      </div>
    </div>
  );
}
