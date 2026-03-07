import { useState, useEffect } from 'react';

/**
 * useLocalStorage — Hook de persistência simples
 * Sincroniza estado React com localStorage automaticamente.
 * @param {string} key — chave no localStorage
 * @param {*} defaultValue — valor padrão se não existir
 */
export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Quota exceeded ou modo privado — silencioso
    }
  }, [key, value]);

  return [value, setValue];
}
