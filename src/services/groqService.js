// ============================================================
// groqService.js — Oracle IA
// Prioridade: Groq (se tiver chave válida) → Pollinations AI (sem chave, gratuito)
// Pollinations: https://text.pollinations.ai — sem registro, sem limite
// ============================================================

const GROQ_KEY  = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL  = 'https://api.groq.com/openai/v1/chat/completions';
const POLL_URL  = 'https://text.pollinations.ai';

const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
];

const SYSTEM_PROMPT = `Você é o NEXUS, assistente especialista em jogos e backlog gamer.
Responda qualquer pergunta sobre jogos: recomendações, promoções, lançamentos, análises, ROI, estratégia de compra.
Quando o usuário tiver jogos na biblioteca, priorize recomendar deles. Para perguntas gerais (like "jogos de tiro em promoção"), use seu conhecimento de jogos.
Seja direto, técnico, máximo 140 palavras.
Use "→" para bullets e "[TAG]" para seções.
Responda SEMPRE em português brasileiro.`;

function buildContext({ games = [], calendar = {}, availMin = 60 }) {
  const backlog = games.filter(g => g.status === 'backlog');
  const playing = games.filter(g => g.status === 'playing');
  if (!games.length) return '[BIBLIOTECA VAZIA]';

  const list = backlog.slice(0, 8).map(g =>
    `${g.title}${g.ttbMain ? `(${g.ttbMain}h)` : ''}${g.pricePaid ? ` R$${g.pricePaid}` : ''}${g.metacritic ? ` MC${g.metacritic}` : ''} [${g.genre ?? 'Steam'}]`
  ).join(' | ') || 'vazio';

  return `Tempo: ${availMin < 60 ? `${availMin}min` : `${availMin / 60}h`} | Backlog(${backlog.length}): ${list} | Jogando: ${playing.map(g => g.title).join(', ') || 'nenhum'}`;
}

// ── Engine 1: Groq ──────────────────────────────────────────
async function callGroq(messages) {
  const hasValidKey = GROQ_KEY && GROQ_KEY !== 'SUA_CHAVE_AQUI' && GROQ_KEY.startsWith('gsk_');
  if (!hasValidKey) throw new Error('SKIP_GROQ');

  for (const model of GROQ_MODELS) {
    const res = await fetch(GROQ_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
      body:    JSON.stringify({ model, messages, max_tokens: 220, temperature: 0.65 }),
    });
    if (res.status === 429) continue;
    if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() ?? null;
  }
  throw new Error('Groq quota esgotada');
}

// ── Engine 2: Pollinations AI (sem chave, gratuito) ──────────
async function callPollinations(messages) {
  // Transforma o array de mensagens em um prompt longo
  const prompt = messages.map(m => `[${m.role.toUpperCase()}]\n${m.content}`).join('\n\n');
  
  // Endpoint anônimo real, text puro
  const encoded = encodeURIComponent(prompt);
  const res = await fetch(`https://text.pollinations.ai/${encoded}?model=openai-large&seed=${Math.floor(Math.random()*10000)}`);
  
  if (!res.ok) throw new Error(`Pollinations HTTP ${res.status}`);
  const text = await res.text();
  
  // Se vier com o aviso de deprecation, tratamos como erro para cair no local
  if (text.includes('IMPORTANT NOTICE') && text.includes('deprecated')) {
    throw new Error('Pollinations legacy blocking');
  }
  
  return text?.trim() || null;
}

// ── Exportação principal ────────────────────────────────────
export async function getOracleRecommendation(userMessage, context = {}) {
  if (!context.games?.length) {
    return `[ERRO — SEM DADOS]\n→ Biblioteca vazia. Sincronize sua conta Steam.`;
  }

  const ctx      = buildContext(context);
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user',   content: `[CONTEXTO]\n${ctx}\n\n[PERGUNTA]\n${userMessage}` },
  ];

  // Tenta Groq primeiro
  try {
    const resp = await callGroq(messages);
    if (resp) return resp;
  } catch (e) {
    if (e.message !== 'SKIP_GROQ') console.warn('[groqService] Groq falhou:', e.message);
  }

  // Fallback: Pollinations AI (sem chave)
  try {
    const resp = await callPollinations(messages);
    if (resp) return resp;
  } catch (e) {
    console.warn('[groqService] Pollinations falhou:', e.message);
  }

  return `[OFFLINE]\n→ Sem conexão com IA. Use comandos locais.\n→ Digite "ajuda" para ver os comandos disponíveis.`;
}

// Sempre retorna true — Pollinations não precisa de chave
export function isGroqConfigured() {
  return true;
}

// ── Nova Curadoria com Ofertas Reais (CheapShark) ───────────
export async function curateOffers(userGames, topDeals) {
  if (!topDeals || !topDeals.length) return [];
  
  const ctx = buildContext({ games: userGames, availMin: 60 });
  const dealList = topDeals
    .map((d, i) => `ID:${i} | ${d.title} | R$${d.price} (-${Math.round(d.savings)}%) | MC:${d.mc || 'N/A'}`)
    .join('\n');
  
  const prompt = `Como um curador de ofertas focado no meu backlog e gosto:
Revise meu perfil e escolha os 6 jogos mais alinhados dessas 30 ofertas Steam atuais.
Retorne APENAS um array JSON de inteiros (o ID de cada oferta escolhida). Exemplo exato: [0, 5, 12, 17, 22, 29]

[MEU CONTEXTO]
${ctx}

[OFERTAS STEAM DISPONÍVEIS]
${dealList}`;

  const messages = [
    { role: 'system', content: 'Você é um JSON bot. Responda ESTRITAMENTE com um array JSON de 6 inteiros correspondentes aos IDs selecionados, mais nada.' },
    { role: 'user', content: prompt }
  ];

  const parseOrFallback = (text) => {
    try {
      const match = text.match(/\[[\d\s,]+\]/);
      if (match) {
        const ids = JSON.parse(match[0]);
        const curated = ids.map(id => topDeals[id]).filter(Boolean);
        if (curated.length > 0) return curated.slice(0, 6);
      }
    } catch {}
    return null;
  };

  try {
    const raw = await callGroq(messages);
    if (raw) {
      const res = parseOrFallback(raw);
      if (res) return res;
    }
  } catch (e) {
    if (e.message !== 'SKIP_GROQ') console.warn('[groqService] curateOffers Groq falhou:', e.message);
  }

  try {
    const raw = await callPollinations(messages);
    if (raw) {
      const res = parseOrFallback(raw);
      if (res) return res;
    }
  } catch (e) {
    console.warn('[groqService] curateOffers Pollinations falhou:', e.message);
  }

  // Fallback: retorna os 6 primeiros (com melhores deal ratings do CheapShark)
  return topDeals.slice(0, 6);
}
