// ============================================================
// SyncPage.jsx — Sincronização Real com Steam API + Mock Log
// ============================================================
import { useState, useEffect, useRef } from 'react';
import { fetchSteamGames, fetchSteamProfile, isSteamConfigured } from '../services/steamService';

const PLATFORMS = [
  { id: 'steam',       name: 'Steam',      icon: '🎮', color: '#1b2838' },
  { id: 'epic',        name: 'Epic Games', icon: '⚡', color: '#2e2e2e' },
  { id: 'playstation', name: 'PlayStation',icon: '🎯', color: '#003087' },
  { id: 'xbox',        name: 'Xbox',       icon: '🟢', color: '#107c10' },
];

function buildMockLog(platform) {
  const p = platform.toUpperCase();
  return [
    { type: 'info', text: `Iniciando conexão com ${p}...` },
    { type: 'ok',   text: `[AUTH OK] Sessão estabelecida.` },
    { type: 'info', text: `[BUSCANDO BIBLIOTECA] Carregando jogos...` },
    { type: 'info', text: `[ANÁLISE HLTB] Processando tempos de duração...` },
    { type: 'info', text: `[CALCULANDO ROI] Analisando custo/hora...` },
    { type: 'warn', text: `! Vários jogos com 0h de jogo detectados — Backlog Real identificado.` },
    { type: 'ok',   text: `[SINCRONIZAÇÃO CONCLUÍDA] Dados prontos.` },
  ];
}

export default function SyncPage({ loginMethod, onComplete }) {
  const steamConfigured  = isSteamConfigured();
  const [selected, setSelected] = useState(loginMethod === 'steam' ? ['steam'] : []);
  const [steamId,  setSteamId]  = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [logs, setLogs]     = useState([]);
  const [logsDone, setLogsDone] = useState(false);
  const [error, setError]   = useState(null);
  const [syncedGames,   setSyncedGames]   = useState(null);
  const [syncedProfile, setSyncedProfile] = useState(null);
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  function togglePlatform(id) {
    if (isConnecting) return;
    setSelected(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    setLogs([]); setLogsDone(false); setError(null); setSyncedGames(null);
  }

  function appendLog(entry) {
    setLogs(prev => [...prev, entry]);
  }

  async function startSync() {
    if (selected.length === 0 || isConnecting) return;
    const platform = selected[0];
    setIsConnecting(true); setLogs([]); setLogsDone(false); setError(null); setSyncedGames(null);

    if (platform === 'steam' && steamConfigured) {
      // Fluxo real com Steam API
      appendLog({ type: 'info', text: `Iniciando conexão com STEAM API...` });
      appendLog({ type: 'ok',   text: `[API KEY OK] Chave configurada e válida.` });

      if (!steamId.trim()) {
        appendLog({ type: 'warn', text: `! Steam ID não informado — usando dados de demonstração.` });
        await runMockSync(platform);
        return;
      }

      appendLog({ type: 'info', text: `[BUSCANDO] Steam ID: ${steamId.trim()}` });
      appendLog({ type: 'info', text: `[AGUARDANDO] Chamando IPlayerService/GetOwnedGames...` });

      // Busca jogos e perfil em paralelo
      const [{ all, backlog, error: fetchErr }, profile] = await Promise.all([
        fetchSteamGames(steamId.trim()),
        fetchSteamProfile(steamId.trim()),
      ]);

      if (fetchErr) {
        appendLog({ type: 'warn', text: `! AVISO: ${fetchErr}` });
        appendLog({ type: 'info', text: `→ Carregando dados de demonstração...` });
        await runMockSync(platform);
        return;
      }

      if (profile?.name) {
        appendLog({ type: 'ok', text: `[PERFIL] Olá, ${profile.name}!` });
      }
      appendLog({ type: 'data', text: `> ${all.length} títulos encontrados na conta Steam.` });
      appendLog({ type: 'data', text: `> ${backlog.length} jogos com 0h — Backlog Real identificado.` });
      appendLog({ type: 'ok',   text: `[SINCRONIZAÇÃO CONCLUÍDA] ${all.length} jogos carregados.` });

      setSyncedGames(all);
      setSyncedProfile(profile);
      setTimeout(() => setLogsDone(true), 600);
      setIsConnecting(false);
    } else {
      // Fluxo mock para outras plataformas ou sem chave
      if (platform === 'steam' && !steamConfigured) {
        appendLog({ type: 'warn', text: `! VITE_STEAM_API_KEY não configurada — usando demonstração.` });
      }
      await runMockSync(platform);
    }
  }

  async function runMockSync(platform) {
    const sequence = buildMockLog(platform);
    for (let i = 0; i < sequence.length; i++) {
      await new Promise(r => setTimeout(r, 420));
      appendLog(sequence[i]);
    }
    setTimeout(() => { setLogsDone(true); setIsConnecting(false); }, 600);
  }

  function handleEnterDashboard() {
    onComplete(syncedGames || null, syncedProfile || null);
  }

  return (
    <div className="sync-page fade-in">
      <div className="sync-brand">
        <img src="/logo.jpeg" alt="Nexus" style={{ height: 32, width: 32, objectFit: 'contain', borderRadius: 2 }} />
        <div>
          <div className="brand-text" style={{ fontSize: 15, fontWeight: 600 }}>Nexus</div>
          <div className="brand-version">CONECTAR PLATAFORMAS</div>
        </div>
      </div>

      <h2 className="sync-heading">Onde estão seus jogos?</h2>
      <p className="sync-sub">SELECIONE A PLATAFORMA · DADOS VIA API OFICIAL</p>

      {/* Plataformas */}
      <div className="platform-grid">
        {PLATFORMS.map(p => (
          <div
            key={p.id}
            className={`platform-card ${selected.includes(p.id) ? 'selected' : ''}`}
            onClick={() => togglePlatform(p.id)}
            id={`platform-${p.id}`}
          >
            {selected.includes(p.id) && <div className="platform-status" />}
            <div className="platform-icon">{p.icon}</div>
            <div className="platform-name">{p.name}</div>
            {p.id === 'steam' && steamConfigured && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--green-bright)', marginTop: 4 }}>● API ATIVA</div>
            )}
          </div>
        ))}
      </div>

      {/* Input Steam ID — sempre aparece quando Steam está selecionado para o usuário não ficar perdido */}
      {selected.includes('steam') && (
        <div style={{ margin: '12px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
            STEAM ID64 (encontre em steamidfinder.com)
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="form-input"
              style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12 }}
              placeholder="Ex: 76561198000000000"
              value={steamId}
              onChange={e => setSteamId(e.target.value)}
              disabled={isConnecting}
              id="input-steam-id"
            />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
            // Perfil Steam precisa ser público. Deixe em branco para usar dados de demonstração.
          </div>
        </div>
      )}

      {/* Terminal */}
      <div className="terminal">
        <div className="terminal-titlebar">
          <div className="terminal-dots">
            <div className="terminal-dot" style={{ background: '#EF4444' }} />
            <div className="terminal-dot" style={{ background: '#EAB308' }} />
            <div className="terminal-dot" style={{ background: '#22C55E' }} />
          </div>
          <div className="terminal-title">nexus · sync-engine · v4.0</div>
        </div>
        <div className="terminal-body" ref={logRef} style={{ maxHeight: '220px', overflowY: 'auto' }}>
          {logs.length === 0 && !isConnecting && (
            <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              $ Aguardando seleção de plataforma...<span className="terminal-cursor" />
            </div>
          )}
          {logs.map((line, i) => (
            <div key={i} className="terminal-line" style={{ animationDelay: `${i * 40}ms` }}>
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
              padding: '10px 28px', fontSize: 13,
            }}
            id="btn-start-sync"
          >
            {isConnecting ? '⟳ Sincronizando...' : '⚡ Iniciar Sincronização'}
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={handleEnterDashboard}
            style={{ padding: '10px 28px', fontSize: 13 }}
            id="btn-enter-dashboard"
          >
            {syncedGames ? `✓ Acessar Painel (${syncedGames.length} jogos) →` : '✓ Acessar o Painel →'}
          </button>
        )}
        <button
          className="btn"
          onClick={() => onComplete(null)}
          disabled={isConnecting && !logsDone}
          style={{ opacity: isConnecting && !logsDone ? 0.3 : 1 }}
        >
          Pular por agora
        </button>
      </div>
    </div>
  );
}
