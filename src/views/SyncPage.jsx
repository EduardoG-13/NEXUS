import { useState, useEffect, useRef } from 'react';

const PLATFORMS = [
  { id: 'steam',      name: 'Steam',      icon: '🎮', color: '#1b2838' },
  { id: 'epic',       name: 'Epic Games', icon: '⚡', color: '#2e2e2e' },
  { id: 'playstation',name: 'PlayStation', icon: '🎯', color: '#003087' },
  { id: 'xbox',       name: 'Xbox',       icon: '🟢', color: '#107c10' },
];

// Simulated terminal log sequence
// TODO: Replace with real Steam/Epic API OAuth + HLTB lookup calls
function buildLogSequence(platform) {
  const p = platform.toUpperCase();
  return [
    { type: 'info',  text: `Iniciando autenticação OAuth com ${p}...` },
    { type: 'ok',    text: `[AUTH OK] Token recebido com sucesso.` },
    { type: 'info',  text: `[BUSCANDO BIBLIOTECA] Carregando seus jogos...` },
    { type: 'data',  text: `> 247 títulos encontrados na conta ${p}.` },
    { type: 'info',  text: `[CONSULTA HLTB] Buscando tempos no HowLongToBeat.com...` },
    { type: 'info',  text: `[ANÁLISE DE TÍTULOS] Processando jogos recentes...` },
    { type: 'data',  text: `> Elden Ring · 55h história · 133h completar 100%` },
    { type: 'data',  text: `> Hades · 22h história · 90h completar 100%` },
    { type: 'data',  text: `> Baldur's Gate 3 · 100h história · 281h completar 100%` },
    { type: 'info',  text: `[CALCULANDO BACKLOG SCORE] Analisando saúde do backlog...` },
    { type: 'warn',  text: `! Backlog Score: 28/100 — CRÍTICO · muitos jogos acumulados` },
    { type: 'info',  text: `[ROI ANALYSIS] Verificando histórico de preços e custo/hora...` },
    { type: 'data',  text: `> R$ 847,32 em capital parado no backlog.` },
    { type: 'ok',    text: `[SINCRONIZAÇÃO CONCLUÍDA] Base de dados pronta.` },
  ];
}

export default function SyncPage({ loginMethod, onComplete }) {
  const [selected, setSelected] = useState(loginMethod === 'steam' ? ['steam'] : []);
  const [isConnecting, setIsConnecting] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logsDone, setLogsDone] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState(null);
  const logRef = useRef(null);

  // Auto scroll terminal
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  function togglePlatform(id) {
    if (isConnecting) return;
    setSelected(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  }

  function startSync() {
    if (selected.length === 0 || isConnecting) return;
    const platform = selected[0];
    setConnectingPlatform(platform);
    setIsConnecting(true);
    setLogs([]);
    setLogsDone(false);

    const sequence = buildLogSequence(platform);
    sequence.forEach((entry, i) => {
      setTimeout(() => {
        setLogs(prev => [...prev, entry]);
        if (i === sequence.length - 1) {
          setTimeout(() => setLogsDone(true), 600);
        }
      }, i * 420 + 200);
    });
  }

  const totalMs = 14 * 420 + 800;

  return (
    <div className="sync-page fade-in">
      <div className="sync-brand">
        <div className="brand-mark">B</div>
        <div>
          <div className="brand-text" style={{ fontSize: 15, fontWeight: 600 }}>BacklogBurner</div>
          <div className="brand-version">CONECTAR PLATAFORMAS</div>
        </div>
      </div>

      <h2 className="sync-heading">Onde estão seus jogos?</h2>
      <p className="sync-sub">
        SELECIONE AS PLATAFORMAS · DADOS LIDOS VIA API OFICIAL
      </p>

      {/* Platform Grid */}
      <div className="platform-grid">
        {PLATFORMS.map(p => (
          <div
            key={p.id}
            className={`platform-card ${selected.includes(p.id) ? 'selected' : ''} ${connectingPlatform === p.id ? 'connecting' : ''}`}
            onClick={() => togglePlatform(p.id)}
            id={`platform-${p.id}`}
          >
            {selected.includes(p.id) && <div className="platform-status" />}
            <div className="platform-icon">{p.icon}</div>
            <div className="platform-name">{p.name}</div>
          </div>
        ))}
      </div>

      {/* Terminal Console */}
      <div className="terminal">
        <div className="terminal-titlebar">
          <div className="terminal-dots">
            <div className="terminal-dot" style={{ background: '#EF4444' }} />
            <div className="terminal-dot" style={{ background: '#EAB308' }} />
            <div className="terminal-dot" style={{ background: '#22C55E' }} />
          </div>
          <div className="terminal-title">backlogburner · sync-engine · v2.0</div>
        </div>
        <div
          className="terminal-body"
          ref={logRef}
          style={{ maxHeight: '220px', overflowY: 'auto' }}
        >
          {logs.length === 0 && !isConnecting && (
            <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              $ Aguardando seleção de plataforma...<span className="terminal-cursor" />
            </div>
          )}
          {logs.map((line, i) => (
            <div
              key={i}
              className="terminal-line"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <span className="term-prompt">$</span>
              <span className={`term-${line.type}`}>{line.text}</span>
            </div>
          ))}
          {isConnecting && !logsDone && (
            <div className="terminal-line" style={{ marginTop: 4 }}>
              <span className="term-prompt">$</span>
              <span className="terminal-cursor" />
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="sync-cta">
        {!logsDone ? (
          <button
            className="btn btn-primary"
            onClick={startSync}
            disabled={selected.length === 0 || isConnecting}
            style={{
              opacity: selected.length === 0 || isConnecting ? 0.4 : 1,
              cursor: selected.length === 0 || isConnecting ? 'default' : 'pointer',
              padding: '10px 28px',
              fontSize: 13,
            }}
            id="btn-start-sync"
          >
            {isConnecting ? '⟳ Sincronizando...' : '⚡ Iniciar Sincronização'}
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={onComplete}
            style={{ padding: '10px 28px', fontSize: 13 }}
            id="btn-enter-dashboard"
          >
            ✓ Acessar o Painel →
          </button>
        )}
        <button
          className="btn"
          onClick={onComplete}
          disabled={isConnecting && !logsDone}
          style={{ opacity: isConnecting && !logsDone ? 0.3 : 1 }}
        >
          Pular por agora
        </button>
      </div>
    </div>
  );
}
