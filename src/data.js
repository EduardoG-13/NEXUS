// BacklogBurner V2 — Mock Data + AI Logic
// === Mock Library ===
export const GAMES = [
  { id: 1,  title: "Elden Ring",        emoji: "⚔️",  platform: "PC / PS5",    genre: "Action RPG",     ttbMain: 55,  ttbFull: 133, price: 249.90, status: "backlog",  metacritic: 96 },
  { id: 2,  title: "Hades",             emoji: "🔱",  platform: "PC",           genre: "Roguelike",      ttbMain: 22,  ttbFull: 90,  price: 49.99,  status: "playing",  metacritic: 93 },
  { id: 3,  title: "Cyberpunk 2077",    emoji: "🌆",  platform: "PC",           genre: "Action RPG",     ttbMain: 25,  ttbFull: 103, price: 149.90, status: "backlog",  metacritic: 88 },
  { id: 4,  title: "Hollow Knight",     emoji: "🦋",  platform: "PC / Switch",  genre: "Metroidvania",   ttbMain: 44,  ttbFull: 68,  price: 34.99,  status: "backlog",  metacritic: 90 },
  { id: 5,  title: "Stray",             emoji: "🐱",  platform: "PC / PS5",     genre: "Adventure",      ttbMain: 5,   ttbFull: 8,   price: 99.90,  status: "backlog",  metacritic: 83 },
  { id: 6,  title: "The Witcher 3",     emoji: "🐺",  platform: "PC",           genre: "Action RPG",     ttbMain: 51,  ttbFull: 189, price: 29.99,  status: "finished", metacritic: 93 },
  { id: 7,  title: "Sekiro",            emoji: "🗡️", platform: "PC / PS4",     genre: "Action",         ttbMain: 30,  ttbFull: 67,  price: 189.90, status: "backlog",  metacritic: 91 },
  { id: 8,  title: "Disco Elysium",     emoji: "🎭",  platform: "PC",           genre: "RPG",            ttbMain: 22,  ttbFull: 38,  price: 59.99,  status: "backlog",  metacritic: 97 },
  { id: 9,  title: "Baldur's Gate 3",   emoji: "🎲",  platform: "PC",           genre: "RPG",            ttbMain: 100, ttbFull: 281, price: 239.90, status: "playing",  metacritic: 96 },
  { id: 10, title: "Portal 2",          emoji: "🌀",  platform: "PC",           genre: "Puzzle",         ttbMain: 9,   ttbFull: 16,  price: 19.99,  status: "backlog",  metacritic: 95 },
  { id: 11, title: "Celeste",           emoji: "🏔️", platform: "PC / Switch",  genre: "Platformer",     ttbMain: 10,  ttbFull: 35,  price: 39.99,  status: "backlog",  metacritic: 92 },
  { id: 12, title: "Returnal",          emoji: "🌀",  platform: "PS5",          genre: "Roguelike",      ttbMain: 25,  ttbFull: 45,  price: 199.90, status: "backlog",  metacritic: 86 },
];

// === Mock Wishlist ===
export const WISHLIST = [
  { id: 1, title: "Black Myth: Wukong",     emoji: "🐒", genre: "Action RPG",    ttbMain: 30, price: 299.90, histLow: 199.90, isHistLow: false, rating: 82 },
  { id: 2, title: "Metaphor: ReFantazio",   emoji: "👑", genre: "Turn-based RPG", ttbMain: 75, price: 249.90, histLow: 249.90, isHistLow: true,  rating: 94 },
  { id: 3, title: "Helldivers 2",           emoji: "🪖", genre: "Co-op Shooter",  ttbMain: 20, price: 149.90, histLow: 89.90,  isHistLow: false, rating: 82 },
  { id: 4, title: "Path of Exile 2",        emoji: "💀", genre: "ARPG",           ttbMain: 50, price: 0,      histLow: 0,      isHistLow: true,  rating: 88, isFree: true },
  { id: 5, title: "Monster Hunter Wilds",   emoji: "🦕", genre: "Action RPG",    ttbMain: 45, price: 349.90, histLow: 349.90, isHistLow: true,  rating: 91 },
  { id: 6, title: "Silksong",               emoji: "🕷️", genre: "Metroidvania", ttbMain: 35, price: null,   histLow: null,   isHistLow: false, rating: null, unreleased: true },
];

// ============================================================
// AI LOGIC (Simulated — real API goes here)
// ============================================================

/**
 * getPrescription
 * Recommends a game from the backlog that fits the available time window.
 * TODO: Replace with OpenAI/Gemini API call that considers completion stats,
 *       player mood, and genre diversity.
 *
 * @param {Array}  games         - Current game library
 * @param {number} availableMin  - Available time in minutes
 * @returns {{ game, reason }}
 */
export function getPrescription(games, availableMin) {
  const availHours = availableMin / 60;
  const backlog = games.filter(g => g.status === 'backlog');

  // Special cases by time window
  if (availableMin <= 30) {
    // Under 30 min: pick the shortest session-friendly game
    const pick = backlog.sort((a, b) => a.ttbMain - b.ttbMain)[0];
    return {
      game: pick,
      reason: `Sessões curtas funcionam melhor com jogos de loop rápido. Cada run conta.`,
    };
  }

  if (availableMin <= 60) {
    // ~1h: Look for session-friendly game (Hades, roguelikes, short adventures)
    const pick = backlog.find(g => g.genre === 'Roguelike' || g.genre === 'Adventure')
      || backlog.sort((a, b) => a.ttbMain - b.ttbMain)[0];
    return {
      game: pick,
      reason: `Tempo ideal para um loop de gameplay completo. Você vai sentir progresso real.`,
    };
  }

  // 2h+: Recommend the highest rated / most impactful game
  const pick = backlog.sort((a, b) => b.metacritic - a.metacritic)[0];
  return {
    game: pick,
    reason: `Com 2h+, você pode se imergir em narrativas profundas. Máximo ROI de experiência.`,
  };
}

/**
 * computeROI
 * Calculates cost-per-hour for a wishlist item.
 * TODO: Integrate IsThereAnyDeal API for real historical low prices.
 *
 * @param {number} price   - Current price in BRL
 * @param {number} ttbMain - HLTB main story hours
 * @returns {number|null}
 */
export function computeROI(price, ttbMain) {
  if (!price || !ttbMain) return null;
  return parseFloat((price / ttbMain).toFixed(2));
}

/**
 * computeStats
 * Derives all dashboard metrics from the current game library.
 * @param {Array} games
 */
export function computeStats(games) {
  const backlog   = games.filter(g => g.status === 'backlog');
  const playing   = games.filter(g => g.status === 'playing');
  const finished  = games.filter(g => g.status === 'finished');

  const totalSpent   = games.reduce((s, g) => s + g.price, 0);
  const backlogSpent = backlog.reduce((s, g) => s + g.price, 0);
  const backlogHours = backlog.reduce((s, g) => s + g.ttbMain, 0);
  const totalHours   = games.reduce((s, g) => s + g.ttbMain, 0);
  const completionPct = Math.round((finished.length / games.length) * 100);

  // Score: starts at 100, decreases 8 pts per backlog game (min 0)
  const score = Math.max(0, Math.min(100, Math.round(100 - backlog.length * 8)));
  const health = score >= 70 ? 'good' : score >= 40 ? 'warning' : 'critical';

  return {
    backlog, playing, finished,
    total: games.length,
    totalSpent, backlogSpent, backlogHours, totalHours,
    completionPct, score, health,
  };
}
