// O Oráculo — Consultor Tático de Games
// Lógica simulada de IA baseada em switch/case
// TODO: Substituir por chamada real à API Gemini/OpenAI com os dados do usuário

import { useState, useRef, useEffect } from 'react';
import { getPrescription, computeROI, WISHLIST } from '../data';

// Preços fictícios de lojas para simulação
// TODO: Integrar com API da IsThereAnyDeal.com
const MOCK_PRICES = {
  'elden ring':        { steam: 'R$249', nuuvem: 'R$189', eneba: 'R$210' },
  'hades':             { steam: 'R$49',  nuuvem: 'R$38',  eneba: 'R$42'  },
  'cyberpunk 2077':    { steam: 'R$149', nuuvem: 'R$89',  eneba: 'R$120' },
  'hollow knight':     { steam: 'R$34',  nuuvem: 'R$28',  eneba: 'R$30'  },
  'stray':             { steam: 'R$99',  nuuvem: 'R$79',  eneba: 'R$85'  },
  'sekiro':            { steam: 'R$189', nuuvem: 'R$149', eneba: 'R$169' },
  'disco elysium':     { steam: 'R$59',  nuuvem: 'R$45',  eneba: 'R$52'  },
  'baldur\'s gate 3':  { steam: 'R$239', nuuvem: 'R$199', eneba: 'R$219' },
  'portal 2':          { steam: 'R$19',  nuuvem: 'R$14',  eneba: 'R$16'  },
  'celeste':           { steam: 'R$39',  nuuvem: 'R$29',  eneba: 'R$33'  },
};

const HINT_CMDS = [
  'o que jogar em 30 min?',
  'o que jogar em 1 hora?',
  'o que jogar em 2 horas?',
  'menor preço de Hades?',
  'menor preço de Elden Ring?',
  'vale comprar Metaphor?',
  'vale comprar Black Myth?',
  'analise meu backlog',
  'ajuda',
];

/**
 * processCommand — Lógica do Oráculo
 * TODO: Substituir por chamada à Gemini API com contexto do usuário
 */
function processCommand(input, games) {
  const q = input.toLowerCase().trim();

  // Ajuda
  if (q === 'ajuda' || q === 'help' || q === '?') {
    return {
      type: 'ai',
      text: `[COMANDOS DISPONÍVEIS]
→ "o que jogar em [30 min / 1 hora / 2 horas]?"
→ "menor preço de [nome do jogo]?"
→ "vale comprar [nome do jogo]?"
→ "analise meu backlog"
→ "ajuda"`,
    };
  }

  // Recomendação por tempo
  const tempoMatch = q.match(/o que jogar em (\d+)\s*(min|hora|h)/);
  if (tempoMatch || q.includes('o que jogar em')) {
    let mins = 60;
    if (tempoMatch) {
      mins = tempoMatch[2].startsWith('h') ? Number(tempoMatch[1]) * 60 : Number(tempoMatch[1]);
    } else if (q.includes('30 min')) mins = 30;
    else if (q.includes('2 hora') || q.includes('2h')) mins = 120;

    const { game, reason } = getPrescription(games, mins);
    if (!game) return { type: 'ai', text: '[SEM DADOS] Backlog vazio. Adicione jogos à biblioteca.' };

    const cph = computeROI(game.price, game.ttbMain);
    return {
      type: 'ai',
      text: `[RECOMENDAÇÃO — ${mins < 60 ? mins + 'min' : mins / 60 + 'h'}]
→ ${game.emoji} ${game.title}
→ Duração: ${game.ttbMain}h (HLTB main)
→ ROI: R$${cph?.toFixed(2) ?? '?'}/h de lazer
→ Metacritic: ${game.metacritic}/100

// ${reason}`,
    };
  }

  // Menor preço
  if (q.includes('menor preço') || q.includes('preco de') || q.includes('preço de')) {
    const keys = Object.keys(MOCK_PRICES);
    const match = keys.find(k => q.includes(k));
    if (!match) {
      return {
        type: 'ai',
        text: `[BUSCANDO PREÇOS...]
Não encontrei esse jogo na base. Tente:
${keys.slice(0, 5).map(k => `→ "${k}"`).join('\n')}`,
      };
    }
    const prices = MOCK_PRICES[match];
    const sorted = Object.entries(prices).sort((a, b) => {
      const av = parseInt(a[1].replace(/\D/g, ''));
      const bv = parseInt(b[1].replace(/\D/g, ''));
      return av - bv;
    });
    return {
      type: 'ai',
      text: `[LOJAS — ${match.toUpperCase()}]
${sorted.map(([loja, preco]) => `→ ${loja.padEnd(10)} ${preco}`).join('\n')}

// Menor preço: ${sorted[0][0].toUpperCase()} · ${sorted[0][1]}
// TODO: API IsThereAnyDeal.com para dados em tempo real`,
    };
  }

  // Vale comprar
  if (q.includes('vale comprar') || q.includes('vale a pena')) {
    const wishlistItem = WISHLIST.find(w =>
      q.includes(w.title.toLowerCase()) ||
      Object.keys(MOCK_PRICES).some(k => q.includes(k) && w.title.toLowerCase().includes(k.split(' ')[0]))
    );

    if (wishlistItem) {
      const cph = computeROI(wishlistItem.price, wishlistItem.ttbMain);
      const verdict = cph === null ? 'N/A'
        : cph <= 3 ? '✅ EXCELENTE COMPRA'
        : cph <= 7 ? '🟡 COMPRA RAZOÁVEL — aguarde promoção'
        : '🔴 ROI FRACO — espere -40% ou mais';

      return {
        type: 'ai',
        text: `[ANÁLISE ROI — ${wishlistItem.title.toUpperCase()}]
→ Preço atual:   ${wishlistItem.isFree ? 'GRÁTIS' : 'R$' + wishlistItem.price?.toFixed(0)}
→ HLTB main:     ${wishlistItem.ttbMain}h
→ Custo/Hora:    ${wishlistItem.isFree ? 'R$0,00/h' : cph ? 'R$' + cph.toFixed(2) + '/h' : 'N/A'}
→ Metacritic:    ${wishlistItem.rating ?? 'N/A'}/100
→ Mín. histórico: ${wishlistItem.histLow ? 'R$' + wishlistItem.histLow.toFixed(0) : 'N/A'}

// VEREDICTO: ${verdict}`,
      };
    }

    return {
      type: 'ai',
      text: `[SEM DADOS] Jogo não encontrado na wishlist.
Adicione à Smart Buy para ativar análise de ROI.

// TODO: API IGDB + IsThereAnyDeal para análise completa`,
    };
  }

  // Analisar backlog
  if (q.includes('analise') || q.includes('backlog') || q.includes('análise')) {
    const bl = games.filter(g => g.status === 'backlog');
    const spent = bl.reduce((s, g) => s + g.price, 0);
    const hours = bl.reduce((s, g) => s + g.ttbMain, 0);
    const shortGame = [...bl].sort((a, b) => a.ttbMain - b.ttbMain)[0];
    const bestRoi = [...bl].sort((a, b) => (b.ttbMain / b.price) - (a.ttbMain / a.price))[0];

    return {
      type: 'ai',
      text: `[DIAGNÓSTICO DO BACKLOG]
→ Jogos pendentes:  ${bl.length}
→ Capital parado:   R$${spent.toFixed(0)}
→ Horas de lazer:   ${hours}h (~${Math.round(hours / 8)} dias)

[RECOMENDAÇÕES TÁTICAS]
→ Jogo mais curto:  ${shortGame?.emoji} ${shortGame?.title} (${shortGame?.ttbMain}h)
→ Melhor ROI:       ${bestRoi?.emoji} ${bestRoi?.title} (R$${computeROI(bestRoi?.price, bestRoi?.ttbMain)?.toFixed(2)}/h)

// Use 🔥 QUEIMAR em jogos que não vai jogar nunca.
// Cada decisão libera carga mental.`,
    };
  }

  // Fallback
  return {
    type: 'ai',
    text: `[ERRO DE PARSE]
Não reconheci esse comando.
Digite "ajuda" para ver os comandos disponíveis.

// TODO: Integrar Gemini API para linguagem natural completa`,
  };
}

const INITIAL_MSG = {
  type: 'system',
  text: `[O ORÁCULO v1.0 — INICIALIZADO]
Sou seu consultor tático de games.
Analiso ROI, recomendo jogos e caço preços.
Digite "ajuda" para ver os comandos.`,
};

export default function OracleChat({ games, onClose }) {
  const [messages, setMessages] = useState([INITIAL_MSG]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const msgRef = useRef(null);

  useEffect(() => {
    if (msgRef.current) msgRef.current.scrollTop = msgRef.current.scrollHeight;
  }, [messages]);

  function send(text) {
    const q = text || input.trim();
    if (!q) return;
    setInput('');

    const userMsg = { type: 'user', text: q };
    setMessages(prev => [...prev, userMsg]);
    setTyping(true);

    // Simulated AI latency — gives "thinking" feel
    setTimeout(() => {
      const response = processCommand(q, games);
      setMessages(prev => [...prev, response]);
      setTyping(false);
    }, 400 + Math.random() * 300);
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <div className="oracle-panel">
      {/* Header */}
      <div className="oracle-header">
        <div className="oracle-title">
          <div className="oracle-dot" />
          ⬡ O ORÁCULO
        </div>
        <button className="oracle-close" onClick={onClose}>✕ FECHAR</button>
      </div>

      {/* Messages */}
      <div className="oracle-messages" ref={msgRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`oracle-msg ${msg.type}`}>
            <div className="oracle-msg-prefix">
              {msg.type === 'user' ? '› VOCÊ' : msg.type === 'system' ? '⬡ SISTEMA' : '⬡ ORÁCULO'}
            </div>
            <div className="oracle-msg-text" style={{ whiteSpace: 'pre-wrap' }}>
              {msg.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="oracle-msg ai">
            <div className="oracle-msg-prefix">⬡ ORÁCULO</div>
            <div className="oracle-msg-text">
              [PROCESSANDO...]<span className="terminal-cursor" />
            </div>
          </div>
        )}
      </div>

      {/* Quick hints */}
      <div className="oracle-hints">
        {HINT_CMDS.slice(0, 5).map(h => (
          <button key={h} className="oracle-hint-chip" onClick={() => send(h)}>
            {h}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="oracle-input-row">
        <input
          className="oracle-input"
          placeholder="Digite um comando..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          autoFocus
        />
        <button className="oracle-send" onClick={() => send()}>ENVIAR</button>
      </div>
    </div>
  );
}
