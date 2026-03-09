// ============================================================
// geminiService.js — NEXUS Oracle powered by Gemini
// Retry automático em 429 + fallback para gemini-1.5-flash-8b
// ============================================================
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Ordem de tentativa: modelo rápido → modelo leve (mais cota gratuita)
const MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-flash'];

const SYSTEM_PROMPT = `Você é o NEXUS, uma inteligência tática de elite para gestão de backlog de jogos.
Sua função é curar o tempo de lazer do usuário com precisão cirúrgica.
Use os dados fornecidos para recomendar 1 jogo baseado no tempo disponível.

REGRAS DE COMPORTAMENTO:
- Seja direto, técnico e objetivo. Sem papo furado.
- Mencione: nome do jogo, duração HLTB (se disponível), custo/hora (ROI se preço informado).
- Formate como terminal: use "→" para bullets e "[SEÇÃO]" para headers.
- Responda SEMPRE em português brasileiro.
- Máximo de 150 palavras por resposta.`;

function buildContext({ games = [], calendar = {}, memories = [], availMin = 60 }) {
  const backlog  = games.filter(g => g.status === 'backlog');
  const playing  = games.filter(g => g.status === 'playing');

  const backlogSummary = backlog.slice(0, 8).map(g =>
    `- ${g.title}${g.ttbMain ? ` | ${g.ttbMain}h` : ''}${g.pricePaid ? ` | R$${g.pricePaid}` : ''} | ${g.genre ?? 'Steam'}`
  ).join('\n') || 'Backlog vazio';

  const upcomingSlots = Object.entries(calendar)
    .map(([k, v]) => ({ time: new Date(k), ...v }))
    .filter(s => s.time > new Date())
    .sort((a, b) => a.time - b.time)
    .slice(0, 3)
    .map(s => {
      const game = games.find(g => String(g.id) === String(s.gameId));
      return `- ${game?.title ?? '?'} às ${s.time.getHours()}h`;
    }).join('\n') || 'Nenhuma';

  const memorySummary = memories.length > 0
    ? memories.slice(0, 3).map(m => `- ${m}`).join('\n')
    : 'Sem histórico';

  return `[CONTEXTO]
Tempo livre: ${availMin < 60 ? `${availMin}min` : `${availMin / 60}h`}
Backlog (${backlog.length} jogos): ${backlogSummary}
Em progresso: ${playing.map(g => g.title).join(', ') || 'Nenhum'}
Sessões agendadas: ${upcomingSlots}
Memória: ${memorySummary}`;
}

/**
 * Chama Gemini com retry automático entre modelos em caso de 429.
 */
export async function getOracleRecommendation(userMessage, context = {}) {
  const total = (context.games ?? []).length;

  if (total === 0) {
    return `[ERRO — SEM DADOS DE BACKLOG]
→ Biblioteca vazia. Sincronize sua conta Steam para análise tática.

// Acesse: Sincronização → informe seu Steam ID64 → Iniciar`;
  }

  if (!API_KEY) {
    return `[MODO LOCAL — SEM CHAVE GEMINI]
→ Configure VITE_GEMINI_API_KEY no arquivo .env.
// https://aistudio.google.com/`;
  }

  const contextBlock = buildContext(context);
  const fullPrompt   = `${contextBlock}\n\n[PERGUNTA]\n${userMessage}`;
  const genAI        = new GoogleGenerativeAI(API_KEY);

  for (const modelName of MODELS) {
    try {
      const model  = genAI.getGenerativeModel({ model: modelName, systemInstruction: SYSTEM_PROMPT });
      const result = await model.generateContent(fullPrompt);
      return result.response.text();
    } catch (err) {
      const is429 = err.message?.includes('429') || err.status === 429;
      const isNotFound = err.message?.includes('404') || err.message?.includes('not found');

      if (is429 || isNotFound) {
        // Tenta o próximo modelo
        console.warn(`[geminiService] ${modelName} falhou (${is429 ? '429' : '404'}), tentando próximo...`);
        continue;
      }

      // Erro diferente de cota — não tenta outro modelo
      console.error('[geminiService] Erro:', err);
      if (err.message?.includes('API key') || err.message?.includes('API_KEY_INVALID')) {
        return `[ERRO DE AUTENTICAÇÃO]\n→ Chave Gemini inválida. Verifique seu .env.`;
      }
      return `[GEMINI OFFLINE]\n→ ${err.message ?? 'Erro desconhecido'}.\n→ Use a engine local (modo fallback ativo).`;
    }
  }

  // Todos os modelos esgotaram cota
  return `[COTA ESGOTADA — TODOS OS MODELOS]
→ Limite diário da API Gemini atingido.
→ Resets ocorrem à meia-noite (horário Google).

// Use a engine local enquanto isso:
// "o que jogar?", "analise meu backlog", "roi"`;
}

export function isGeminiConfigured() {
  return Boolean(API_KEY);
}
