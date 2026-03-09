// ============================================================
// steamService.js — Steam API com Cache localStorage
// ============================================================

const STEAM_API_KEY = import.meta.env.VITE_STEAM_API_KEY;

// URLs limpas sem headers restritivos
const CORS_PROXIES = [
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  url => `https://thingproxy.freeboard.io/fetch/${url}`,
  url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}` // Proxy extra sem auth
];

const CACHE_KEY     = 'nexus_steam_cache';
const CACHE_TTL_MS  = 1000 * 60 * 60 * 6; // 6 horas

// ── Imagem via Steam CDN (sem auth) ────────────────────────
export function steamHeader(appId) {
  return appId
    ? `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`
    : null;
}

// ── Fetch robusto com fallback ────────────────────────────────
async function fetchWithProxy(targetUrl) {
  let lastError;
  for (const proxyFn of CORS_PROXIES) {
    try {
      const proxiedUrl = proxyFn(targetUrl);
      const res = await fetch(proxiedUrl, { headers: { 'x-requested-with': 'XMLHttpRequest' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      lastError = err;
      console.warn(`[steamService proxy fallback] Falhou: ${err.message}. Tentando próximo...`);
    }
  }
  throw lastError || new Error('All CORS proxies failed');
}

// ── Cache helpers ───────────────────────────────────────────
function readCache(steamId) {
  try {
    const raw  = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.steamId !== steamId) return null;
    if (Date.now() - data.timestamp > CACHE_TTL_MS) return null;
    return data.games;
  } catch { return null; }
}

function writeCache(steamId, games) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      steamId,
      timestamp: Date.now(),
      games,
    }));
  } catch (e) { console.warn('[steamService] Cache write failed:', e); }
}

export function clearSteamCache() {
  localStorage.removeItem(CACHE_KEY);
}

export function getCacheInfo() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return {
      steamId:   data.steamId,
      count:     data.games?.length ?? 0,
      timestamp: new Date(data.timestamp),
      expired:   Date.now() - data.timestamp > CACHE_TTL_MS,
    };
  } catch { return null; }
}

// ── Transformação: Steam → Schema NEXUS ─────────────────────
const EMOJIS = ['🎮','⚔️','🧙','🔫','🏎️','🌌','🗡️','🕹️','🏰','👾','🌀','🦋','🐱','💀','🎭'];

function toNexusGame(steamGame, idx) {
  const minutesPlayed = steamGame.playtime_forever ?? 0;
  const hoursPlayed   = Math.round(minutesPlayed / 60);

  return {
    id:          `steam_${steamGame.appid}`,
    title:       steamGame.name,
    emoji:       EMOJIS[idx % EMOJIS.length],
    platform:    'Steam',
    genre:       'Steam',
    // Status: 0h = backlog definitivo; < 2h = provavelmente backlog
    status:      hoursPlayed === 0 ? 'backlog' : hoursPlayed < 2 ? 'backlog' : 'playing',
    ttbMain:     null,      // Sem HLTB real → usuário preenche
    ttbFull:     null,
    pricePaid:   null,      // Steam API NÃO expõe preço pago → usuário preenche
    metacritic:  null,
    hoursPlayed,
    steamAppId:  steamGame.appid,
    // Imagem via CDN público Steam (sem autenticação)
    cover: steamHeader(steamGame.appid),
    source: 'steam',
  };
}

// ── fetchSteamGames ─────────────────────────────────────────
/**
 * Busca todos os jogos da conta Steam.
 * - Usa cache por 6h para evitar rate limit
 * - Filtra backlog por playtime_forever === 0
 * - Preserva imagens via CDN public
 *
 * @param {string} steamId   — Steam ID64
 * @param {boolean} forceRefresh — ignora cache
 */
export async function fetchSteamGames(steamId, forceRefresh = false) {
  if (!STEAM_API_KEY) {
    return {
      all: [], backlog: [],
      error: 'VITE_STEAM_API_KEY não configurada. Adicione ao arquivo .env.',
      fromCache: false,
    };
  }

  if (!steamId?.trim()) {
    return { all: [], backlog: [], error: 'Steam ID inválido.', fromCache: false };
  }

  const id = steamId.trim();

  // Tenta cache antes de fazer request
  if (!forceRefresh) {
    const cached = readCache(id);
    if (cached) {
      const backlog = cached.filter(g => g.hoursPlayed === 0);
      return { all: cached, backlog, error: null, fromCache: true };
    }
  }

  try {
    const steamUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${id}&include_appinfo=true&include_played_free_games=true&format=json`;
    
    // Agora usando a função wrapper que tenta até 3 proxies caso o primeiro dê bloqueio de preflight (CORS)
    const data = await fetchWithProxy(steamUrl);
    const raw  = data?.response?.games ?? [];

    if (raw.length === 0) {
      return {
        all: [], backlog: [],
        error: 'Nenhum jogo encontrado. Verifique se o perfil Steam é público.',
        fromCache: false,
      };
    }

    // Processa em batch — sem chamada individual por jogo
    const all     = raw.map(toNexusGame);
    const backlog = all.filter(g => g.hoursPlayed === 0);

    // Salva no cache
    writeCache(id, all);

    return { all, backlog, error: null, fromCache: false };
  } catch (err) {
    console.error('[steamService]', err);
    return {
      all: [], backlog: [],
      error: `Falha ao acessar Steam: ${err.message}. Perfil precisa ser público.`,
      fromCache: false,
    };
  }
}

/**
 * Busca o perfil público do usuário Steam (nome e avatar).
 * Endpoint: ISteamUser/GetPlayerSummaries/v2
 */
export async function fetchSteamProfile(steamId) {
  if (!STEAM_API_KEY || !steamId?.trim()) return null;
  
  // Tenta fetch direto via proxy
  try {
    const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${steamId.trim()}&format=json`;
    const data = await fetchWithProxy(url);
    const player = data?.response?.players?.[0];
    if (!player) return null;
    return {
      name:      player.personaname,
      avatarUrl: player.avatarmedium ?? player.avatar,
      steamId:   steamId.trim(),
    };
  } catch (err) {
    console.warn('[steamService] fetchSteamProfile falhou via fetch, nome pode não aparecer:', err.message);
    return null;
  }
}

export function isSteamConfigured() {
  return Boolean(STEAM_API_KEY && STEAM_API_KEY.length > 10);
}
