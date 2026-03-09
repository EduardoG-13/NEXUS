// Settings Page — Configurações
import { useState } from 'react';
import { clearAllMemories, isSupermemoryConfigured } from '../services/supermemoryService';

const PLATFORMS_OPTS = [
  { id: 'steam',       label: 'Steam',       icon: '🎮' },
  { id: 'epic',        label: 'Epic Games',  icon: '⚡' },
  { id: 'playstation', label: 'PlayStation', icon: '🎯' },
  { id: 'xbox',        label: 'Xbox',        icon: '🟢' },
  { id: 'switch',      label: 'Nintendo',    icon: '🔴' },
  { id: 'mobile',      label: 'Mobile',      icon: '📱' },
];

const THEME_OPTS = [
  { id: 'dark',     label: 'Dark Industrial (Padrão)' },
  { id: 'tactical', label: 'Tactical Green' },
  { id: 'ember',    label: 'Ember Red' },
];

const HLTB_PREF = [
  { id: 'main',  label: 'Só a história principal' },
  { id: 'extra', label: 'História + extras' },
  { id: 'full',  label: 'Completar 100%' },
];

export default function Settings({ profile, onSave }) {
  const [name,      setName]      = useState(profile.name || 'Gamer#7423');
  const [avatar,    setAvatar]    = useState(profile.avatar || 'G');
  const [platforms, setPlatforms] = useState(profile.platforms || ['steam']);
  const [theme,     setTheme]     = useState(profile.theme || 'dark');
  const [hltbPref,  setHltbPref]  = useState(profile.hltbPref || 'main');
  const [saved,     setSaved]     = useState(false);
  const [clearing,  setClearing]  = useState(false);

  function togglePlatform(id) {
    setPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
    setSaved(false);
  }

  function handleSave() {
    setSaved(true);
    onSave({ name, avatar: name.charAt(0).toUpperCase(), platforms, theme, hltbPref });
    setTimeout(() => setSaved(false), 2500);
  }

  function handleExportLibrary() {
    const games = JSON.parse(localStorage.getItem('bb_games') || '[]');
    const blob  = new Blob([JSON.stringify(games, null, 2)], { type: 'application/json' });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement('a');
    a.href      = url;
    a.download  = `nexus_biblioteca_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleClearAllData() {
    const confirmed = window.confirm(
      '⚠️ ATENÇÃO\n\nIsso irá apagar TODOS os seus dados locais e memórias na Supermemory.\n\nEssa ação é irreversível. Continuar?'
    );
    if (!confirmed) return;
    setClearing(true);
    try {
      if (isSupermemoryConfigured()) await clearAllMemories();
      localStorage.clear();
      window.location.reload();
    } catch (err) {
      console.error('Erro ao limpar dados:', err);
      localStorage.clear();
      window.location.reload();
    }
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-header">
        <div>
          <div className="page-title">Configurações</div>
          <div className="page-subtitle">PERFIL · PLATAFORMAS · PREFERÊNCIAS</div>
        </div>
      </div>

      <div className="page-body" style={{ flex: 1 }}>
        <div className="settings-grid">
          {/* Perfil */}
          <div className="settings-card">
            <div className="settings-card-title">// PERFIL</div>

            <div className="avatar-row">
              <div className="avatar-preview">
                {name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                  AVATAR GERADO DO NOME
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Altere o nome para mudar o avatar
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">NOME DE PERFIL</label>
              <input
                className="form-input"
                value={name}
                onChange={e => { setName(e.target.value); setSaved(false); }}
                placeholder="Seu nome de gamer"
              />
            </div>

            <div className="form-group">
              <label className="form-label">PLANO</label>
              <div style={{
                padding: '8px 12px',
                background: 'var(--accent-dim)',
                border: '1px solid var(--accent-border)',
                borderRadius: 2,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--accent)',
                letterSpacing: '0.08em',
              }}>
                ★ ACESSO ANTECIPADO — BETA GRATUITO
              </div>
            </div>
          </div>

          {/* Plataformas */}
          <div className="settings-card">
            <div className="settings-card-title">// PLATAFORMAS</div>
            <div className="platform-toggle">
              {PLATFORMS_OPTS.map(p => (
                <button
                  key={p.id}
                  className={`platform-toggle-btn ${platforms.includes(p.id) ? 'on' : ''}`}
                  onClick={() => togglePlatform(p.id)}
                >
                  <span>{p.icon}</span>
                  <span>{p.label}</span>
                  {platforms.includes(p.id) && (
                    <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9 }}>✓</span>
                  )}
                </button>
              ))}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 10 }}>
              // {platforms.length} plataforma(s) ativa(s)
            </div>
          </div>

          {/* Preferências de Jogo */}
          <div className="settings-card">
            <div className="settings-card-title">// PREFERÊNCIA HLTB</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 12 }}>
              // Define qual métrica usar para calcular duração dos jogos
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {HLTB_PREF.map(h => (
                <button
                  key={h.id}
                  onClick={() => { setHltbPref(h.id); setSaved(false); }}
                  style={{
                    padding: '9px 12px',
                    border: `1px solid ${hltbPref === h.id ? 'var(--accent)' : 'var(--border-hi)'}`,
                    background: hltbPref === h.id ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                    color: hltbPref === h.id ? 'var(--accent)' : 'var(--text-secondary)',
                    borderRadius: 2,
                    fontSize: 12,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 80ms ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                    {hltbPref === h.id ? '◉' : '○'}
                  </span>
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tema */}
          <div className="settings-card">
            <div className="settings-card-title">// TEMA DE INTERFACE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {THEME_OPTS.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTheme(t.id); setSaved(false); }}
                  style={{
                    padding: '9px 12px',
                    border: `1px solid ${theme === t.id ? 'var(--accent)' : 'var(--border-hi)'}`,
                    background: theme === t.id ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                    color: theme === t.id ? 'var(--accent)' : 'var(--text-secondary)',
                    borderRadius: 2,
                    fontSize: 12,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 80ms ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                    {theme === t.id ? '◉' : '○'}
                  </span>
                  {t.label}
                  {t.id !== 'dark' && (
                    <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
                      EM BREVE
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Dados */}
          <div className="settings-card" style={{ gridColumn: 'span 2' }}>
            <div className="settings-card-title">// DADOS E PRIVACIDADE</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 12 }}>
              // Privacy by Design — minimização de dados e controle total do usuário.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {/* Exportar */}
              <div style={{ background: 'var(--bg-root)', border: '1px solid var(--border)', borderRadius: 2, padding: '12px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 4 }}>EXPORTAR BIBLIOTECA</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10 }}>Baixa um .json com todos os seus jogos e dados locais.</div>
                <button className="btn" style={{ fontSize: 11 }} onClick={handleExportLibrary} id="btn-export-library">Exportar .json</button>
              </div>
              {/* Supermemory status */}
              <div style={{ background: 'var(--bg-root)', border: '1px solid var(--border)', borderRadius: 2, padding: '12px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 4 }}>SUPERMEMORY RAG</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10 }}>
                  {isSupermemoryConfigured() ? 'Memória de IA ativa. Histórico salvo na nuvem.' : 'Inativo — configure VITE_SUPERMEMORY_API_KEY no .env.'}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, padding: '4px 8px', background: isSupermemoryConfigured() ? 'var(--green-dim)' : 'var(--bg-elevated)', color: isSupermemoryConfigured() ? 'var(--green-bright)' : 'var(--text-muted)', border: `1px solid ${isSupermemoryConfigured() ? 'var(--green-border)' : 'var(--border-hi)'}`, borderRadius: 2, display: 'inline-block' }}>
                  {isSupermemoryConfigured() ? '● ONLINE' : '○ OFFLINE'}
                </div>
              </div>
              {/* Limpar tudo */}
              <div style={{ background: 'var(--bg-root)', border: '1px solid #3f1515', borderRadius: 2, padding: '12px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#DC2626', letterSpacing: '0.1em', marginBottom: 4 }}>LIMPAR TODOS OS DADOS</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10 }}>Apaga localStorage e memórias Supermemory. Irreversível.</div>
                <button
                  className="btn btn-danger"
                  style={{ fontSize: 11 }}
                  onClick={handleClearAllData}
                  disabled={clearing}
                  id="btn-clear-all-data"
                >
                  {clearing ? '⟳ Limpando...' : '🗑 Apagar Tudo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Bar */}
      <div className="settings-save-bar">
        <div className="settings-save-hint">
          {saved
            ? '✓ CONFIGURAÇÕES SALVAS LOCALMENTE'
            : '// Alterações não salvas'}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost">Descartar</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            id="btn-save-settings"
          >
            {saved ? '✓ Salvo' : 'Salvar Configurações'}
          </button>
        </div>
      </div>
    </div>
  );
}
