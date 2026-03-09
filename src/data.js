// ============================================================
// NEXUS — DATA LAYER
// REGRA DE OURO: Zero mock. A biblioteca nasce vazia.
// Dados vêm da Steam API ou de entrada manual do usuário.
// ============================================================

/**
 * Gera URL de capa Steam a partir do appId — CDN público sem auth.
 */
export function steamCover(appId) {
  return appId
    ? `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`
    : null;
}

// VAZIO — biblioteca nasce limpa.
// Jogos entram via: sincronização Steam ou botão "Adicionar Jogo".
export const GAMES_DEFAULT = [];

// ── WISHLIST ─────────────────────────────────────────────────
export const WISHLIST_DEFAULT = [];

// ── FUNÇÕES DE ANÁLISE ────────────────────────────────────────

/**
 * computeROI — Custo por Hora de Lazer
 */
export function computeROI(price, hours) {
  if (!price || !hours || hours === 0) return null;
  return parseFloat((price / hours).toFixed(2));
}

/**
 * getPrescription — Recomendação baseada no tempo disponível
 */
export function getPrescription(games, availMinutes) {
  const backlog = games.filter(g => g.status === 'backlog');
  if (backlog.length === 0) return { game: null, reason: 'Backlog vazio.' };

  // Filtra jogos com HLTB preenchido para cálculo de ROI
  const withData = backlog.filter(g => g.ttbMain && g.ttbMain > 0);
  const pool = withData.length > 0 ? withData : backlog;

  const sorted = [...pool].sort((a, b) => {
    const roiA = computeROI(a.pricePaid, a.ttbMain) ?? 999;
    const roiB = computeROI(b.pricePaid, b.ttbMain) ?? 999;
    const mcA  = (a.metacritic ?? 75) / 100;
    const mcB  = (b.metacritic ?? 75) / 100;
    return (mcB / roiB) - (mcA / roiA);
  });

  let pick = sorted[0];
  if (availMinutes <= 45) {
    const short = sorted.filter(g => g.ttbMain && g.ttbMain <= 15);
    if (short.length) pick = short[0];
  } else if (availMinutes <= 90) {
    const med = sorted.filter(g => g.ttbMain && g.ttbMain <= 40);
    if (med.length) pick = med[0];
  }

  const timeLabel = availMinutes < 60
    ? `${availMinutes} minutos`
    : availMinutes === 60 ? '1 hora' : `${availMinutes / 60} horas`;

  const cph = computeROI(pick.pricePaid, pick.ttbMain);
  const roiStr = cph ? `R$${cph.toFixed(2)}/h` : 'ROI pendente (adicione o preço pago)';

  return {
    game: pick,
    reason: `Melhor candidato para ${timeLabel}. ${roiStr}`,
  };
}

/**
 * computeStats — Métricas globais do backlog
 */
export function computeStats(games) {
  const backlog  = games.filter(g => g.status === 'backlog');
  const playing  = games.filter(g => g.status === 'playing');
  const finished = games.filter(g => g.status === 'finished');
  const total    = games.length;

  const backlogSpent = backlog.reduce((s, g)  => s + (g.pricePaid || 0), 0);
  const totalSpent   = games.reduce((s, g)    => s + (g.pricePaid || 0), 0);
  const backlogHours = backlog.reduce((s, g)  => s + (g.ttbMain || 0), 0);
  const totalHours   = games.reduce((s, g)    => s + (g.ttbMain || 0), 0);

  const completionPct = total > 0 ? Math.round((finished.length / total) * 100) : 0;
  const score = Math.max(0, Math.min(100, Math.round(
    (finished.length / Math.max(total, 1)) * 60 +
    (playing.length  / Math.max(total, 1)) * 25 +
    Math.max(0, 15 - backlog.length)
  )));

  const health = score >= 60 ? 'good' : score >= 35 ? 'warning' : 'critical';

  const savedValue = finished.reduce((s, g) => {
    const movieEquiv = (g.ttbMain ?? 0 / 2) * 35;
    return s + (movieEquiv - (g.pricePaid ?? 0));
  }, 0);

  return {
    backlog, playing, finished, total,
    backlogSpent, totalSpent, backlogHours, totalHours,
    completionPct, score, health, savedValue,
  };
}
