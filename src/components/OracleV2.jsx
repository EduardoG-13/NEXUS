// ============================================================
// O ORÁCULO V4 — Groq (Llama 3.3) como IA principal
// Fallback: engine local estruturada
// ============================================================
import { useState, useRef, useEffect } from 'react';
import { computeROI, computeStats } from '../data';
import { getOracleRecommendation, isGroqConfigured } from '../services/groqService';

const HINTS = [
  'o que jogar agora?',
  'analise meu backlog',
  'melhor roi do backlog',
  'o que jogar em 30 min?',
  'próximas sessões',
];

// ── Fallback local ───────────────────────────────────────────
function processLocal(q, games, calendar) {
  const lower   = q.toLowerCase().trim();
  const backlog = games.filter(g => g.status === 'backlog');
  const stats   = computeStats(games);

  if (lower === 'ajuda' || lower === '?') {
    return `[COMANDOS]\n→ "o que jogar?" / "o que jogar em Xmin?"\n→ "analise meu backlog" / "roi"\n→ "próximas sessões"`;
  }

  if (lower.includes('sessões') || lower.includes('sessao')) {
    const upcoming = Object.entries(calendar)
      .filter(([k]) => new Date(k) > new Date())
      .sort(([a],[b]) => new Date(a) - new Date(b))
      .slice(0, 3)
      .map(([k, v]) => {
        const g = games.find(g => String(g.id) === String(v.gameId));
        const t = new Date(k);
        return `→ ${g?.emoji ?? '🎮'} ${g?.title ?? '?'} — ${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][t.getDay()]} às ${t.getHours()}h`;
      });
    return upcoming.length
      ? `[PRÓXIMAS SESSÕES]\n${upcoming.join('\n')}`
      : '[SEM SESSÕES] Nenhuma sessão agendada no Calendário Tático.';
  }

  if (lower.includes('roi') || lower.includes('analise') || lower.includes('backlog')) {
    if (backlog.length === 0) return '[BACKLOG VAZIO] Sincronize a Steam.';
    const cap  = backlog.reduce((s, g) => s + (g.pricePaid ?? 0), 0);
    const hrs  = backlog.reduce((s, g) => s + (g.ttbMain ?? 0), 0);
    const best = [...backlog].filter(g => g.pricePaid && g.ttbMain)
      .sort((a,b) => computeROI(a.pricePaid, a.ttbMain) - computeROI(b.pricePaid, b.ttbMain))[0];
    return `[DIAGNÓSTICO DO BACKLOG]
→ ${backlog.length} jogos pendentes
→ Capital parado: R$${cap.toFixed(0)}
→ Horas de lazer: ${hrs}h (~${Math.round(hrs/8)} dias)
→ Score: ${stats.score}/100
${best ? `→ Melhor ROI: ${best.emoji} ${best.title} — R$${computeROI(best.pricePaid, best.ttbMain).toFixed(2)}/h` : ''}`;
  }

  if (lower.includes('jogar') || lower.includes('agora') || lower.includes('hoje') || lower.includes('min')) {
    if (backlog.length === 0) return '[BACKLOG VAZIO] Sincronize a Steam para receber recomendações.';
    let mins = 60;
    const mM = lower.match(/(\d+)\s*min/); if (mM) mins = +mM[1];
    const hM = lower.match(/(\d+)\s*h/);   if (hM) mins = +hM[1] * 60;
    if (lower.includes('30')) mins = 30;
    if (lower.includes('2h') || lower.includes('2 hora')) mins = 120;

    const pool    = backlog.filter(g => !g.ttbMain || (mins <= 30 ? g.ttbMain <= 20 : mins <= 60 ? g.ttbMain <= 50 : true));
    const pick    = (pool.length ? pool : backlog).sort((a, b) => {
      const ra = computeROI(a.pricePaid ?? a.price, a.ttbMain) ?? 10;
      const rb = computeROI(b.pricePaid ?? b.price, b.ttbMain) ?? 10;
      return ra - rb;
    })[0];
    const cph = pick ? computeROI(pick.pricePaid ?? pick.price, pick.ttbMain) : null;
    return `[RECOMENDAÇÃO — ${mins < 60 ? `${mins}min` : `${mins/60}h`}]
→ ${pick.emoji} ${pick.title}
→ HLTB: ${pick.ttbMain ?? '--'}h | Plataforma: ${pick.platform}
${cph != null ? `→ ROI: R$${cph.toFixed(2)}/h` : '→ ROI: adicione o preço pago para calcular'}
// Configure VITE_GROQ_API_KEY para análise completa com IA.`;
  }

  return `[LOCAL] Engine offline ativa.\nDigite "ajuda" para comandos ou configure VITE_GROQ_API_KEY para IA real.`;
}

const BOOT_MSG = (groqOn) => ({
  type: 'system',
  text: `[NEXUS ORÁCULO v4 — ${groqOn ? 'GROQ ✓ ONLINE' : 'MODO LOCAL'}]
${groqOn ? '→ Llama 3.3 70B ativo. Linguagem natural completa.' : '→ Sem chave GROQ. Engine local ativa.'}
→ Pergunte qualquer coisa sobre seu backlog.`,
});

// ── Componente ──────────────────────────────────────────────
export default function OracleV2({ games, calendar, wishlist, onClose }) {
  const groqOn   = isGroqConfigured();
  const [msgs,   setMsgs]  = useState([BOOT_MSG(groqOn)]);
  const [input,  setInput]  = useState('');
  const [typing, setTyping] = useState(false);
  const [availMin, setAvailMin] = useState(60);
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [msgs, typing]);

  async function send(text) {
    const q = (text ?? input).trim();
    if (!q || typing) return;
    setInput('');
    setMsgs(prev => [...prev, { type: 'user', text: q }]);
    setTyping(true);

    try {
      let response;
      if (groqOn) {
        response = await getOracleRecommendation(q, { games, calendar, availMin });
      } else {
        await new Promise(r => setTimeout(r, 300));
        response = processLocal(q, games, calendar ?? {});
      }
      setMsgs(prev => [...prev, { type: 'ai', text: response }]);
    } catch (err) {
      setMsgs(prev => [...prev, { type: 'ai', text: `[ERRO] ${err.message}` }]);
    } finally {
      setTyping(false);
    }
  }

  const statusColor = groqOn ? 'var(--green-bright)' : 'var(--yellow)';
  const statusLabel = groqOn ? 'GROQ ONLINE' : 'LOCAL';

  return (
    <div className="oracle-panel">
      <div className="oracle-header">
        <div className="oracle-title">
          <div className="oracle-dot" style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
          ⬡ ORÁCULO · <span style={{ color: statusColor, fontSize: 10 }}>{statusLabel}</span>
        </div>
        <button className="oracle-close" onClick={onClose}>✕ FECHAR</button>
      </div>

      {/* Seletor de tempo */}
      <div style={{ display: 'flex', gap: 5, padding: '7px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>TEMPO→</span>
        {[15, 30, 60, 120].map(m => (
          <button
            key={m}
            onClick={() => setAvailMin(m)}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, padding: '3px 7px',
              border: `1px solid ${availMin === m ? 'var(--accent)' : 'var(--border-hi)'}`,
              background: availMin === m ? 'var(--accent-dim)' : 'transparent',
              color: availMin === m ? 'var(--accent)' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 100ms ease',
            }}
          >{m < 60 ? `${m}min` : `${m/60}h`}</button>
        ))}
      </div>

      {/* Mensagens */}
      <div className="oracle-messages" ref={ref}>
        {msgs.map((m, i) => (
          <div key={i} className={`oracle-msg ${m.type}`}>
            <div className="oracle-msg-prefix">{m.type === 'user' ? '› VOCÊ' : m.type === 'system' ? '⬡ SISTEMA' : '⬡ ORÁCULO'}</div>
            <div className="oracle-msg-text" style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
          </div>
        ))}
        {typing && (
          <div className="oracle-msg ai">
            <div className="oracle-msg-prefix">⬡ ORÁCULO</div>
            <div className="oracle-msg-text">[PROCESSANDO...]<span className="terminal-cursor" /></div>
          </div>
        )}
      </div>

      {/* Hints */}
      <div className="oracle-hints">
        {HINTS.map(h => (
          <button key={h} className="oracle-hint-chip" onClick={() => send(h)} disabled={typing}>{h}</button>
        ))}
      </div>

      {/* Input */}
      <div className="oracle-input-row">
        <input
          className="oracle-input"
          placeholder={groqOn ? 'Pergunte em linguagem natural...' : 'Comando (ex: "ajuda")'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send(); }}
          disabled={typing}
          autoFocus
        />
        <button className="oracle-send" onClick={() => send()} disabled={typing}>
          {typing ? '...' : 'ENVIAR'}
        </button>
      </div>
    </div>
  );
}
