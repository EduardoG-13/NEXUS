// ============================================================
// supermemoryService.js — RAG / Gráfico de Conhecimento
// ============================================================

const API_KEY  = import.meta.env.VITE_SUPERMEMORY_API_KEY;
const BASE_URL = 'https://api.supermemory.ai/v3';

function headers() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
  };
}

/**
 * Salva uma memória no gráfico de conhecimento.
 */
export async function saveMemory(content, metadata = {}) {
  if (!API_KEY || !content) return null;
  try {
    const res = await fetch(`${BASE_URL}/memories`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        content,
        metadata: { app: 'nexus-gamer', ts: new Date().toISOString(), ...metadata },
      }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[supermemoryService] saveMemory falhou:', err.message);
    return null;
  }
}

/**
 * Busca memórias relevantes.
 * Supermemory v3 usa POST /search com body JSON.
 */
export async function searchMemory(query, limit = 5) {
  if (!API_KEY || !query) return [];
  try {
    const res = await fetch(`${BASE_URL}/search`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ q: query, limit }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return (data?.results ?? [])
      .filter(r => r?.document?.content || r?.content)
      .map(r => r?.document?.content ?? r?.content)
      .slice(0, limit);
  } catch (err) {
    console.warn('[supermemoryService] searchMemory falhou:', err.message);
    return [];
  }
}

/**
 * Deleta TODAS as memórias (Privacy — "Limpar Todos os Dados").
 */
export async function clearAllMemories() {
  if (!API_KEY) return { deleted: 0, error: null };
  try {
    const res = await fetch(`${BASE_URL}/memories?limit=100`, {
      method: 'GET', headers: headers(),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    const memories = data?.results ?? data?.memories ?? [];
    let deleted = 0;
    await Promise.all(memories.map(async (m) => {
      const id = m.id ?? m._id;
      if (!id) return;
      try {
        await fetch(`${BASE_URL}/memories/${id}`, { method: 'DELETE', headers: headers() });
        deleted++;
      } catch (_) {}
    }));
    return { deleted, error: null };
  } catch (err) {
    console.warn('[supermemoryService] clearAllMemories falhou:', err.message);
    return { deleted: 0, error: err.message };
  }
}

export function isSupermemoryConfigured() {
  return Boolean(API_KEY);
}
