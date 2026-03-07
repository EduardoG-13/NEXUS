// ============================================================
// BACKLOGBURNER V4 — DATA LAYER
// 15 jogos reais + 6 wishlist com cover Steam CDN
// TODO: Substituir por chamadas à Steam API / IGDB
// ============================================================

// Steam App IDs for cover art via Steam CDN (sem autenticação)
function steamCover(appId) {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
}

export const GAMES_DEFAULT = [
  // ── BACKLOG ──────────────────────────────────────────────
  {
    id: 1, title: 'Elden Ring', emoji: '🔱',
    cover: steamCover(1245620),
    ttbMain: 55, ttbFull: 133,
    pricePaid: 249.90, currentPrice: 189.90, historicLow: 149.90,
    metacritic: 96, genre: 'Action RPG', platform: 'PC',
    status: 'backlog', releaseDate: null,
  },
  {
    id: 2, title: 'Baldur\'s Gate 3', emoji: '🧙',
    cover: steamCover(1086940),
    ttbMain: 100, ttbFull: 281,
    pricePaid: 199.90, currentPrice: 199.90, historicLow: 149.90,
    metacritic: 96, genre: 'RPG', platform: 'PC',
    status: 'backlog', releaseDate: null,
  },
  {
    id: 3, title: 'Hollow Knight', emoji: '🦋',
    cover: steamCover(367520),
    ttbMain: 25, ttbFull: 60,
    pricePaid: 19.90, currentPrice: 14.90, historicLow: 9.90,
    metacritic: 90, genre: 'Metroidvania', platform: 'PC',
    status: 'backlog', releaseDate: null,
  },
  {
    id: 4, title: 'Hades', emoji: '⚡',
    cover: steamCover(1145360),
    ttbMain: 22, ttbFull: 90,
    pricePaid: 49.90, currentPrice: 34.90, historicLow: 24.90,
    metacritic: 93, genre: 'Roguelike', platform: 'PC',
    status: 'backlog', releaseDate: null,
  },
  {
    id: 5, title: 'Disco Elysium', emoji: '🎭',
    cover: steamCover(632470),
    ttbMain: 22, ttbFull: 58,
    pricePaid: 59.90, currentPrice: 29.90, historicLow: 14.90,
    metacritic: 91, genre: 'RPG', platform: 'PC',
    status: 'backlog', releaseDate: null,
  },
  {
    id: 6, title: 'Celeste', emoji: '🏔️',
    cover: steamCover(504230),
    ttbMain: 9, ttbFull: 35,
    pricePaid: 29.90, currentPrice: 19.90, historicLow: 9.90,
    metacritic: 94, genre: 'Plataforma', platform: 'PC',
    status: 'backlog', releaseDate: null,
  },
  {
    id: 7, title: 'Portal 2', emoji: '🌀',
    cover: steamCover(620),
    ttbMain: 9, ttbFull: 16,
    pricePaid: 19.90, currentPrice: 9.90, historicLow: 4.90,
    metacritic: 95, genre: 'Puzzle', platform: 'PC',
    status: 'backlog', releaseDate: null,
  },
  {
    id: 8, title: 'Sekiro: Shadows Die Twice', emoji: '🗡️',
    cover: steamCover(814380),
    ttbMain: 30, ttbFull: 68,
    pricePaid: 189.90, currentPrice: 149.90, historicLow: 99.90,
    metacritic: 91, genre: 'Action', platform: 'PC',
    status: 'backlog', releaseDate: null,
  },
  // ── JOGANDO ──────────────────────────────────────────────
  {
    id: 9, title: 'Cyberpunk 2077', emoji: '🌆',
    cover: steamCover(1091500),
    ttbMain: 28, ttbFull: 105,
    pricePaid: 149.90, currentPrice: 89.90, historicLow: 59.90,
    metacritic: 86, genre: 'Action RPG', platform: 'PC',
    status: 'playing', releaseDate: null,
  },
  {
    id: 10, title: 'Stray', emoji: '🐱',
    cover: steamCover(1332010),
    ttbMain: 5, ttbFull: 8,
    pricePaid: 89.90, currentPrice: 69.90, historicLow: 44.90,
    metacritic: 82, genre: 'Aventura', platform: 'PC',
    status: 'playing', releaseDate: null,
  },
  // ── FINALIZADO ───────────────────────────────────────────
  {
    id: 11, title: 'God of War', emoji: '🪖',
    cover: steamCover(1593500),
    ttbMain: 21, ttbFull: 52,
    pricePaid: 149.90, currentPrice: 119.90, historicLow: 74.90,
    metacritic: 94, genre: 'Action', platform: 'PC',
    status: 'finished', releaseDate: null,
  },
  {
    id: 12, title: 'Returnal', emoji: '🎯',
    cover: steamCover(1649240),
    ttbMain: 25, ttbFull: 73,
    pricePaid: 229.90, currentPrice: 179.90, historicLow: 129.90,
    metacritic: 86, genre: 'Roguelike', platform: 'PC',
    status: 'finished', releaseDate: null,
  },
  {
    id: 13, title: 'Ori and the Will of the Wisps', emoji: '✨',
    cover: steamCover(1057090),
    ttbMain: 9, ttbFull: 19,
    pricePaid: 59.90, currentPrice: 39.90, historicLow: 19.90,
    metacritic: 93, genre: 'Metroidvania', platform: 'PC',
    status: 'finished', releaseDate: null,
  },
  {
    id: 14, title: 'Hades II', emoji: '🔥',
    cover: steamCover(1145350),
    ttbMain: 35, ttbFull: 110,
    pricePaid: 59.90, currentPrice: 59.90, historicLow: 59.90,
    metacritic: 90, genre: 'Roguelike', platform: 'PC',
    status: 'finished', releaseDate: null,
  },
  {
    id: 15, title: 'Resident Evil 4', emoji: '🧟',
    cover: steamCover(2050650),
    ttbMain: 16, ttbFull: 36,
    pricePaid: 249.90, currentPrice: 189.90, historicLow: 124.90,
    metacritic: 93, genre: 'Survival Horror', platform: 'PC',
    status: 'finished', releaseDate: null,
  },
];

// ── WISHLIST ─────────────────────────────────────────────────
export const WISHLIST_DEFAULT = [
  {
    id: 101, title: 'Black Myth: Wukong', emoji: '🐒',
    cover: steamCover(2358720),
    ttbMain: 28, currentPrice: 299.90, historicLow: null,
    releaseDate: '2024-08-20', metacritic: 82, rating: 82,
    genre: 'Action RPG', isHistLow: false, isFree: false,
  },
  {
    id: 102, title: 'Metaphor: ReFantazio', emoji: '👑',
    cover: steamCover(2679460),
    ttbMain: 80, currentPrice: 299.90, historicLow: 199.90,
    releaseDate: null, metacritic: 94, rating: 94,
    genre: 'JRPG', isHistLow: false, isFree: false,
  },
  {
    id: 103, title: 'Silksong', emoji: '🕷️',
    cover: steamCover(1030300),
    ttbMain: 30, currentPrice: null, historicLow: null,
    releaseDate: '2025-12-31', metacritic: null, rating: null,
    genre: 'Metroidvania', isHistLow: false, isFree: false, unreleased: true,
  },
  {
    id: 104, title: 'Clair Obscur: Expedition 33', emoji: '🎨',
    cover: steamCover(2677660),
    ttbMain: 45, currentPrice: 249.90, historicLow: null,
    releaseDate: '2025-04-24', metacritic: null, rating: null,
    genre: 'RPG', isHistLow: false, isFree: false,
  },
  {
    id: 105, title: 'Death Stranding 2', emoji: '👶',
    cover: steamCover(2534040),
    ttbMain: 40, currentPrice: 349.90, historicLow: null,
    releaseDate: '2025-06-26', metacritic: null, rating: null,
    genre: 'Action', isHistLow: false, isFree: false,
  },
  {
    id: 106, title: 'Disco Elysium: The Disco', emoji: '🎺',
    cover: steamCover(632470),
    ttbMain: 30, currentPrice: 14.90, historicLow: 14.90,
    releaseDate: null, metacritic: 97, rating: 97,
    genre: 'RPG', isHistLow: true, isFree: false,
  },
];

// ── FUNÇÕES DE ANÁLISE ────────────────────────────────────────
// TODO: Substituir por Gemini API com contexto do usuário

/**
 * computeROI — Custo por Hora de Lazer
 * @param {number} price — preço pago
 * @param {number} hours — horas de jogo (HLTB)
 * @returns {number|null} custo por hora
 */
export function computeROI(price, hours) {
  if (!price || !hours || hours === 0) return null;
  return parseFloat((price / hours).toFixed(2));
}

/**
 * getPrescription — Recomendação inteligente baseada no tempo disponível
 * TODO: IA Gemini para personalização real
 */
export function getPrescription(games, availMinutes) {
  const backlog = games.filter(g => g.status === 'backlog');
  if (backlog.length === 0) return { game: null, reason: 'Backlog vazio.' };

  const sorted = [...backlog].sort((a, b) => {
    const scoreA = (a.metacritic / 100) * (1 / computeROI(a.pricePaid, a.ttbMain));
    const scoreB = (b.metacritic / 100) * (1 / computeROI(b.pricePaid, b.ttbMain));
    return scoreB - scoreA;
  });

  // Filter by time available
  let pick = sorted[0];
  if (availMinutes <= 45) {
    const short = sorted.filter(g => g.ttbMain <= 15);
    if (short.length) pick = short[0];
  } else if (availMinutes <= 90) {
    const medium = sorted.filter(g => g.ttbMain <= 40);
    if (medium.length) pick = medium[0];
  }

  const timeLabel = availMinutes < 60
    ? `${availMinutes} minutos`
    : availMinutes === 60 ? '1 hora' : `${availMinutes / 60} horas`;

  const cph = computeROI(pick.pricePaid, pick.ttbMain);
  return {
    game: pick,
    reason: `Melhor ROI do backlog com ${timeLabel} disponíveis. R$${cph?.toFixed(2)}/h de lazer — abaixo de Netflix.`,
  };
}

/**
 * computeStats — Métricas globais do backlog
 * TODO: Expandir com média de CPH, streaks de conclusão
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

  // Saved value — what finished games cost vs. what was earned in hours
  const savedValue = finished.reduce((s, g) => {
    const movieEquiv = (g.ttbMain / 2) * 35; // R$35 por sessão de cinema
    return s + (movieEquiv - g.pricePaid);
  }, 0);

  return {
    backlog, playing, finished, total,
    backlogSpent, totalSpent, backlogHours, totalHours,
    completionPct, score, health, savedValue,
  };
}
