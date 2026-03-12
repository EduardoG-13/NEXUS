// ============================================================
// cheapSharkService.js — Busca de Preços e Ofertas (API CheapShark)
// ============================================================

const BASE_URL = 'https://www.cheapshark.com/api/1.0';

/**
 * Busca as 30 melhores promoções atuais da Steam.
 */
export async function getTopDeals() {
  try {
    // storeID=1 (Steam), limite 30 jogos, ordenado por Deal Rating
    const url = `${BASE_URL}/deals?storeID=1&sortBy=Deal%20Rating&pageSize=30`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`CheapShark HTTP ${res.status}`);
    const deals = await res.json();
    
    return deals.map(d => ({
      appId: d.steamAppID,
      title: d.title,
      price: parseFloat(d.salePrice),
      normalPrice: parseFloat(d.normalPrice),
      savings: parseFloat(d.savings),
      isOnSale: d.isOnSale === '1',
      thumb: d.thumb,
      mc: d.metacriticScore ? parseInt(d.metacriticScore) : null,
    })).filter(d => Boolean(d.appId));
  } catch (err) {
    console.error('[cheapSharkService] Erro ao buscar deals:', err.message);
    return [];
  }
}

/**
 * Busca o preço mais barato para um jogo pelo título exato.
 */
export async function getGamePriceByTitle(title) {
  try {
    const url = `${BASE_URL}/games?title=${encodeURIComponent(title)}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && data.length > 0) {
      const g = data[0];
      return parseFloat(g.cheapest); // Menor preço do jogo detectado
    }
    return null;
  } catch(err) {
    console.warn(`[cheapSharkService] Preço de ${title} falhou:`, err.message);
    return null;
  }
}
