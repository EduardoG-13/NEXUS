// ============================================================
// O ORÁCULO V2 — Chat Terminal com Contexto de Calendário
// Novos comandos: preço, o que jogar (lê calendário), roi, calendário
// ============================================================
import { useState, useRef, useEffect } from 'react';
import { getPrescription, computeROI, computeStats } from '../data';

const MOCK_PRICES = {
  'elden ring':        { steam: 'R$189', nuuvem: 'R$149', gamersgate: 'R$165' },
  'hades':             { steam: 'R$34',  nuuvem: 'R$28',  gamersgate: 'R$30'  },
  'cyberpunk 2077':    { steam: 'R$89',  nuuvem: 'R$69',  gamersgate: 'R$80'  },
  'hollow knight':     { steam: 'R$14',  nuuvem: 'R$11',  gamersgate: 'R$12'  },
  'stray':             { steam: 'R$69',  nuuvem: 'R$55',  gamersgate: 'R$60'  },
  'sekiro':            { steam: 'R$149', nuuvem: 'R$119', gamersgate: 'R$135' },
  'celeste':           { steam: 'R$19',  nuuvem: 'R$15',  gamersgate: 'R$17'  },
  'portal 2':          { steam: 'R$9',   nuuvem: 'R$7',   gamersgate: 'R$8'   },
  'disco elysium':     { steam: 'R$29',  nuuvem: 'R$22',  gamersgate: 'R$26'  },
  "baldur's gate 3":   { steam: 'R$199', nuuvem: 'R$159', gamersgate: 'R$179' },
  'black myth wukong': { steam: 'R$299', nuuvem: 'R$249', gamersgate: 'R$270' },
  'metaphor':          { steam: 'R$299', nuuvem: 'R$239', gamersgate: 'R$265' },
};

const HINTS = [
  'o que jogar agora?',
  'o que jogar em 30 min?',
  'preço de Hades',
  'preço de Elden Ring',
  'vale comprar Metaphor?',
  'roi do meu backlog',
  'próximas sessões',
  'analise meu backlog',
  'ajuda',
];

function getNextFreeSlot(calendar) {
  const now = new Date();
  const slots = Object.entries(calendar)
    .map(([key, val]) => ({ time: new Date(key), ...val }))
    .filter(s => s.time > now)
    .sort((a, b) => a.time - b.time);
  return slots[0] || null;
}

function getDayHours(calendar) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  return Object.entries(calendar)
    .filter(([k]) => {
      const d = new Date(k);
      return d >= today && d < tomorrow;
    })
    .map(([k, v]) => ({ time: new Date(k), ...v }));
}

function DAYS_PT() { return ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']; }

function processCmd(q, games, calendar, wishlist) {
  const lower = q.toLowerCase().trim();

  // Ajuda
  if (lower === 'ajuda' || lower === '?') {
    return { type: 'ai', text: `[COMANDOS DISPONÍVEIS]
→ "o que jogar?" / "o que jogar em [tempo]?"
→ "preço de [jogo]"
→ "vale comprar [jogo]?"
→ "roi" / "roi do meu backlog"
→ "próximas sessões" / "calendário"
→ "analise meu backlog"
→ "ajuda"` };
  }

  // Preço de um jogo
  if (lower.startsWith('preço') || lower.startsWith('preco') || lower.includes('menor preço') || lower.includes('preço de')) {
    const keys = Object.keys(MOCK_PRICES);
    const match = keys.find(k => lower.includes(k));
    if (!match) {
      const gameMatch = games.find(g => lower.includes(g.title.toLowerCase().split(' ')[0]));
      if (gameMatch) {
        const key = gameMatch.title.toLowerCase();
        const priceEntry = Object.entries(MOCK_PRICES).find(([k]) => key.includes(k.split(' ')[0]));
        if (priceEntry) {
          const [name, prices] = priceEntry;
          const sorted = Object.entries(prices).sort((a,b) => parseInt(a[1].replace(/\D/g,'')) - parseInt(b[1].replace(/\D/g,'')));
          return { type: 'ai', text: `[PREÇOS — ${gameMatch.title.toUpperCase()}]
${sorted.map(([loja, p]) => `→ ${loja.padEnd(12)} ${p}`).join('\n')}

// Menor: ${sorted[0][0].toUpperCase()} · ${sorted[0][1]}
// TODO: Live via IsThereAnyDeal.com API` };
        }
      }
      return { type: 'ai', text: `[NÃO ENCONTRADO] Jogo não mapeado no Oráculo.
Digite o nome completo ou consulte a aba Compra Inteligente.

// TODO: Integração com IsThereAnyDeal API` };
    }
    const prices = MOCK_PRICES[match];
    const sorted = Object.entries(prices).sort((a,b) => parseInt(a[1].replace(/\D/g,'')) - parseInt(b[1].replace(/\D/g,'')));
    return { type: 'ai', text: `[PREÇOS — ${match.toUpperCase()}]
${sorted.map(([loja, p]) => `→ ${loja.padEnd(12)} ${p}`).join('\n')}

// Melhor negócio: ${sorted[0][0].toUpperCase()} · ${sorted[0][1]}` };
  }

  // O que jogar — lê calendário e backlog
  if (lower.includes('o que jogar') || lower.includes('jogar agora') || lower.includes('jogar hoje')) {
    let mins = 60;
    const m60  = lower.match(/(\d+)\s*(min)/);
    const m120 = lower.includes('2 hora') || lower.includes('2h');
    const m30  = lower.includes('30');
    if (m60) mins = Number(m60[1]);
    else if (m120) mins = 120;
    else if (m30) mins = 30;

    // Check calendar for today
    const todaySessions = getDayHours(calendar);
    if (todaySessions.length > 0) {
      const next = todaySessions[0];
      const game = games.find(g => g.id === next.gameId);
      if (game) {
        const h = next.time.getHours();
        return { type: 'ai', text: `[CALENDÁRIO TÁTICO — HOJE]
→ Você já tem uma sessão agendada!
→ ${game.emoji} ${game.title} às ${h}h
→ HLTB: ${game.ttbMain}h · Metacritic: ${game.metacritic}

// Siga o plano. Consistência bate intensidade.` };
      }
    }

    // No sessions → recommend from backlog
    const { game, reason } = getPrescription(games, mins);
    if (!game) return { type: 'ai', text: '[BACKLOG VAZIO] Adicione jogos à biblioteca para recomendações.' };

    const cph = computeROI(game.pricePaid, game.ttbMain);
    const timeLabel = mins < 60 ? `${mins}min` : `${mins/60}h`;
    return { type: 'ai', text: `[RECOMENDAÇÃO — ${timeLabel.toUpperCase()}]
→ ${game.emoji} ${game.title}
→ Duração: ${game.ttbMain}h (HLTB)
→ Metacritic: ${game.metacritic}/100
→ Custo/Hora: R$${cph?.toFixed(2) ?? '?'}/h de lazer

// ${reason}
// Agende uma sessão no Calendário Tático.` };
  }

  // ROI do backlog
  if (lower.includes('roi')) {
    const stats = computeStats(games);
    const backlog = stats.backlog;
    if (backlog.length === 0) return { type: 'ai', text: '[ROI] Backlog vazio. Adicione jogos para análise.' };

    const totalCapital = backlog.reduce((s, g) => s + (g.pricePaid || 0), 0);
    const totalHoras   = backlog.reduce((s, g) => s + g.ttbMain, 0);
    const avgCPH = totalHoras > 0 ? totalCapital / totalHoras : null;
    const netflixComparison = totalHoras * 1.80;
    const saved = totalCapital - netflixComparison;

    return { type: 'ai', text: `[ROI ANALYSIS — BACKLOG]
→ Capital parado:     R$${totalCapital.toFixed(0)}
→ Horas de lazer:     ${totalHoras}h
→ Custo médio/hora:   R$${avgCPH?.toFixed(2) ?? '?'}/h
→ Equivalente Netflix: R$${netflixComparison.toFixed(0)}

→ Você ${saved > 0 ? 'ECONOMIZOU' : 'PAGOU MAIS'}: R$${Math.abs(saved).toFixed(0)} vs. Netflix
→ Jogos já terminados pouparam R$${stats.savedValue.toFixed(0)} vs. cinema

// $19 bilhões em jogos dormem na Steam globalmente.
// Não seja parte da estatística. QUEIME o backlog.` };
  }

  // Próximas sessões / calendário
  if (lower.includes('próximas sessões') || lower.includes('sessão') || lower.includes('calendário') || lower.includes('calendario')) {
    const upcoming = Object.entries(calendar)
      .map(([k, v]) => ({ time: new Date(k), ...v }))
      .filter(s => s.time > new Date())
      .sort((a, b) => a.time - b.time)
      .slice(0, 5);

    if (upcoming.length === 0) {
      return { type: 'ai', text: `[CALENDÁRIO] Nenhuma sessão agendada.
→ Vá para o Calendário Tático e reserve seu próximo slot de jogo.
// Dados de uso: jogadores que agendam jogam 2x mais horas por semana.` };
    }

    const days = DAYS_PT();
    const lines = upcoming.map(s => {
      const game = games.find(g => g.id === s.gameId);
      const d = s.time;
      return `→ ${game?.emoji ?? '🎮'} ${game?.title ?? 'Jogo'} · ${days[d.getDay()]} ${d.getDate()}/${d.getMonth()+1} às ${d.getHours()}h`;
    });

    return { type: 'ai', text: `[PRÓXIMAS SESSÕES]
${lines.join('\n')}

// ${upcoming.length} sessão(ões) planejada(s). Mantenha a consistência.` };
  }

  // Analisar backlog
  if (lower.includes('analise') || lower.includes('backlog') || lower.includes('análise')) {
    const stats = computeStats(games);
    const bl = stats.backlog;
    const shortGame = [...bl].sort((a,b) => a.ttbMain - b.ttbMain)[0];
    const bestRoi   = [...bl].sort((a,b) => (b.ttbMain/b.pricePaid) - (a.ttbMain/a.pricePaid))[0];

    return { type: 'ai', text: `[DIAGNÓSTICO COMPLETO]
→ Total de jogos:     ${stats.total}
→ Backlog pendente:   ${bl.length} jogos
→ Capital parado:     R$${stats.backlogSpent.toFixed(0)}
→ Horas de lazer:     ${stats.backlogHours}h (~${Math.round(stats.backlogHours/8)} dias)
→ Taxa de conclusão:  ${stats.completionPct}%
→ Backlog Score:      ${stats.score}/100 [${stats.health.toUpperCase()}]

[AÇÕES RECOMENDADAS]
→ Mais curto: ${shortGame?.emoji} ${shortGame?.title} (${shortGame?.ttbMain}h)
→ Melhor ROI: ${bestRoi?.emoji} ${bestRoi?.title} (R$${computeROI(bestRoi?.pricePaid, bestRoi?.ttbMain)?.toFixed(2)}/h)

// Use 🔥 QUEIMAR para jogos que nunca irá jogar.` };
  }

  // Vale comprar
  if (lower.includes('vale comprar') || lower.includes('vale a pena')) {
    const wItem = wishlist?.find(w =>
      lower.includes(w.title.toLowerCase()) ||
      lower.includes(w.title.toLowerCase().split(' ')[0])
    );
    if (!wItem) return { type: 'ai', text: '[NÃO ENCONTRADO] Adicione o jogo à Wishlist para análise de ROI.' };

    const cph = computeROI(wItem.currentPrice, wItem.ttbMain);
    const verdict = !cph ? 'SEM DADOS' : cph <= 3 ? '✅ EXCELENTE COMPRA' : cph <= 7 ? '🟡 AGUARDE PROMOÇÃO' : '🔴 ROI FRACO — espere -40%';

    return { type: 'ai', text: `[ANÁLISE — ${wItem.title.toUpperCase()}]
→ Preço:           ${wItem.isFree ? 'GRÁTIS' : 'R$' + (wItem.currentPrice?.toFixed(0) ?? '?')}
→ Mín. histórico:  ${wItem.historicLow ? 'R$' + wItem.historicLow.toFixed(0) : 'Sem dados'}
→ HLTB:            ${wItem.ttbMain}h
→ Custo/Hora:      ${cph ? 'R$' + cph.toFixed(2) + '/h' : '—'}
→ Metacritic:      ${wItem.rating ?? '—'}/100

// VEREDICTO: ${verdict}` };
  }

  // Fallback
  return { type: 'ai', text: `[PARSE ERROR] Comando não reconhecido.
Digite "ajuda" para ver todos os comandos disponíveis.

// TODO: Gemini API para linguagem natural completa` };
}

const BOOT_MSG = { type: 'system', text: `[O ORÁCULO v2.0 — ONLINE]
Sistema de inteligência tática para gestão de backlog.

→ $19 bilhões em jogos dormem na Steam.
→ Não seja parte da estatística.

Use "ajuda" para ver os comandos.` };

export default function OracleV2({ games, calendar, wishlist, onClose }) {
  const [msgs,   setMsgs]  = useState([BOOT_MSG]);
  const [input,  setInput]  = useState('');
  const [typing, setTyping] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [msgs]);

  function send(text) {
    const q = (text || input).trim();
    if (!q) return;
    setInput('');
    setMsgs(prev => [...prev, { type: 'user', text: q }]);
    setTyping(true);
    setTimeout(() => {
      const res = processCmd(q, games, calendar || {}, wishlist || []);
      setMsgs(prev => [...prev, res]);
      setTyping(false);
    }, 350 + Math.random() * 250);
  }

  return (
    <div className="oracle-panel">
      <div className="oracle-header">
        <div className="oracle-title">
          <div className="oracle-dot" />
          ⬡ O ORÁCULO v2
        </div>
        <button className="oracle-close" onClick={onClose}>✕ FECHAR</button>
      </div>

      <div className="oracle-messages" ref={ref}>
        {msgs.map((m, i) => (
          <div key={i} className={`oracle-msg ${m.type}`}>
            <div className="oracle-msg-prefix">
              {m.type === 'user' ? '› VOCÊ' : m.type === 'system' ? '⬡ SISTEMA' : '⬡ ORÁCULO'}
            </div>
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

      <div className="oracle-hints">
        {HINTS.slice(0, 5).map(h => (
          <button key={h} className="oracle-hint-chip" onClick={() => send(h)}>{h}</button>
        ))}
      </div>

      <div className="oracle-input-row">
        <input
          className="oracle-input"
          placeholder="Digite um comando..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send(); }}
          autoFocus
        />
        <button className="oracle-send" onClick={() => send()}>ENVIAR</button>
      </div>
    </div>
  );
}
