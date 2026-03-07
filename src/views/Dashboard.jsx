import { useState, useMemo, useEffect } from 'react';
import { computeStats, getPrescription } from '../data';

const TIME_OPTIONS = [
  { label: '30 min', value: 30 },
  { label: '1h',     value: 60 },
  { label: '2h+',    value: 120 },
];

function ScoreRing({ score, health }) {
  const R = 46, cx = 52, cy = 52, circ = 2 * Math.PI * R;
  const offset = circ - (score / 100) * circ;
  const colors = { good: '#22C55E', warning: '#CA8A04', critical: '#DC2626' };
  const col = colors[health];
  return (
    <svg width={104} height={104} className="score-svg">
      <circle cx={cx} cy={cy} r={R} stroke="#1A1A1A" strokeWidth="7" fill="none" />
      <circle
        cx={cx} cy={cy} r={R}
        stroke={col}
        strokeWidth="7"
        fill="none"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="butt"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease' }}
      />
    </svg>
  );
}

export default function Dashboard({ games, scoreBonus, onScoreBonusUsed }) {
  const [availMin, setAvailMin]   = useState(60);
  const [bump, setBump]           = useState(false);

  const stats       = useMemo(() => computeStats(games), [games]);
  const prescription = useMemo(() => getPrescription(games, availMin), [games, availMin]);

  // Trigger bump animation when score changes due to burns
  useEffect(() => {
    if (scoreBonus > 0) {
      setBump(true);
      const t = setTimeout(() => { setBump(false); onScoreBonusUsed?.(); }, 500);
      return () => clearTimeout(t);
    }
  }, [scoreBonus]);

  const displayScore = Math.min(100, stats.score + scoreBonus);

  const statCards = [
    {
      label: 'CAPITAL PARADO',
      val: `R$${stats.backlogSpent.toFixed(0)}`,
      sub: `de R$${stats.totalSpent.toFixed(0)} total investido`,
      color: 'c-red',
      barW: stats.backlogSpent / stats.totalSpent,
      barC: 'var(--red)',
    },
    {
      label: 'HORAS DE BACKLOG',
      val: `${stats.backlogHours}h`,
      sub: `≈ ${Math.round(stats.backlogHours / 8)} dias de gameplay`,
      color: 'c-yellow',
      barW: stats.backlogHours / stats.totalHours,
      barC: 'var(--yellow)',
    },
    {
      label: 'TAXA DE CONCLUSÃO',
      val: `${stats.completionPct}%`,
      sub: `${stats.finished.length} de ${stats.total} jogos`,
      color: stats.completionPct >= 50 ? 'c-green' : 'c-accent',
      barW: stats.completionPct / 100,
      barC: stats.completionPct >= 50 ? 'var(--green-bright)' : 'var(--accent)',
    },
  ];

  const healthLabel = { good: 'SAUDÁVEL', warning: 'ATENÇÃO', critical: 'CRÍTICO' };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Command Center</div>
          <div className="page-subtitle">SITUATIONAL AWARENESS — BACKLOG HEALTH</div>
        </div>
        <div className="page-actions">
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            padding: '4px 10px', borderRadius: 'var(--radius)',
          }}>
            <span style={{ color: 'var(--green-bright)' }}>●</span> STEAM · SYNCED
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase()}
          </span>
        </div>
      </div>

      <div className="page-body">
        {/* Row 1: Score + Prescription + Stats */}
        <div className="dash-grid dash-row-1 mb-4">
          {/* Score */}
          <div className={`score-panel ${bump ? 'score-bumping' : ''}`}>
            <div className="card-label">BACKLOG SCORE</div>
            <div className="score-ring-wrap">
              <ScoreRing score={displayScore} health={stats.health} />
              <div className="score-center">
                <span className="score-num">{displayScore}</span>
                <span className="score-denom">/100</span>
              </div>
            </div>
            <span className={`score-tag tag-${stats.health}`}>
              {healthLabel[stats.health]}
            </span>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.7, textAlign: 'center' }}>
              {stats.backlog.length} jogos em backlog<br />
              Use BURN para aumentar
            </p>
          </div>

          {/* Daily Prescription */}
          <div className="prescription-card">
            <div className="rx-top">
              <div className="rx-badge">🩺 DAILY PRESCRIPTION</div>
              <div className="rx-time-picks">
                {TIME_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    className={`rx-time-btn ${availMin === opt.value ? 'active' : ''}`}
                    onClick={() => setAvailMin(opt.value)}
                    id={`rx-time-${opt.value}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {prescription.game ? (
              <div className="rx-body">
                <div className="rx-cover">{prescription.game.emoji}</div>
                <div className="rx-info">
                  <div className="rx-game-title">{prescription.game.title}</div>
                  <div className="rx-chips">
                    <span className="rx-chip hi">⏱ {availMin < 60 ? `${availMin}min` : `${availMin/60}h`} disponíveis</span>
                    <span className="rx-chip">🎮 {prescription.game.ttbMain}h main</span>
                    <span className="rx-chip">⭐ MC {prescription.game.metacritic}</span>
                    <span className="rx-chip">{prescription.game.genre}</span>
                  </div>
                  <p className="rx-reason">{prescription.reason}</p>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                Backlog vazio. Adicione jogos para receber recomendações.
              </p>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>
                ▶ Iniciar Sessão
              </button>
              <button className="btn btn-ghost" style={{ fontSize: 12 }}>Outra Sugestão</button>
            </div>
          </div>

          {/* Stat Cards */}
          {statCards.map(s => (
            <div className="stat-card" key={s.label}>
              <div className="stat-label">{s.label}</div>
              <div className={`stat-val ${s.color}`}>{s.val}</div>
              <div className="stat-sub">{s.sub}</div>
              <div className="stat-bar">
                <div className="stat-bar-fill" style={{ width: `${s.barW * 100}%`, background: s.barC }} />
              </div>
            </div>
          ))}
        </div>

        {/* Row 2: Playing + Insights */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14 }}>
          {/* Playing Now */}
          <div className="card">
            <div className="section-hd">EM PROGRESSO</div>
            {stats.playing.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                Nenhum jogo em andamento.
              </p>
            ) : (
              <div>
                {stats.playing.map(g => (
                  <div key={g.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 0', borderBottom: '1px solid var(--border)'
                  }}>
                    <div className="g-cover">{g.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div className="g-name">{g.title}</div>
                      <div className="g-platform">{g.platform} · {g.genre}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--green-bright)', fontWeight: 700 }}>
                        {g.ttbMain}h
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>HLTB MAIN</div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <span className="s-pill s-playing">JOGANDO</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Insights */}
          <div className="card">
            <div className="section-hd">INSIGHTS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: '💡', text: `Maior ROI do backlog: ${[...stats.backlog].sort((a,b)=>a.ttbMain/a.price > b.ttbMain/b.price ? -1 : 1)[0]?.title ?? '—'}.` },
                { icon: '🔥', text: `${stats.backlog.length} jogos aguardam decisão. Burn ou jogue.` },
                { icon: '💰', text: `R$${stats.backlogSpent.toFixed(0)} em capital subótimo.` },
                { icon: '📊', text: `Conclusão: ${stats.completionPct}%. Meta recomendada: 50%.` },
              ].map((ins, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 8, padding: '8px 10px',
                  background: 'var(--bg-root)', borderRadius: '2px',
                  border: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: 13, flexShrink: 0 }}>{ins.icon}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{ins.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
