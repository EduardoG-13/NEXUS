import { useState } from 'react';

const GENEROS = [
  'Action RPG', 'Roguelike', 'Metroidvania', 'Aventura', 'FPS', 'RPG',
  'Plataforma', 'Puzzle', 'Estratégia', 'Simulação', 'Esporte', 'Outro',
];

const PLATAFORMAS = ['PC', 'PS5', 'PS4', 'Xbox Series', 'Xbox One', 'Switch', 'Mobile'];
const EMOJIS = ['🎮', '⚔️', '🔱', '🌆', '🦋', '🐱', '🐺', '🗡️', '🎭', '🎲', '🌀', '🏔️', '💀', '👑', '🪖'];
const STATUS_OPTS = [
  { value: 'backlog',  label: 'Backlog' },
  { value: 'playing',  label: 'Jogando' },
  { value: 'finished', label: 'Finalizado' },
];

let nextId = 100;

export default function AddGameModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    title: '',
    emoji: '🎮',
    platform: 'PC',
    genre: 'Action RPG',
    ttbMain: '',
    ttbFull: '',
    price: '',
    status: 'backlog',
    metacritic: '',
  });

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function set(key, val) {
    setForm(prev => ({ ...prev, [key]: val }));
    setError('');
  }

  function validate() {
    if (!form.title.trim()) return 'Nome do jogo é obrigatório.';
    if (!form.ttbMain || isNaN(Number(form.ttbMain)) || Number(form.ttbMain) <= 0)
      return 'Tempo de jogo (HLTB) inválido.';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0)
      return 'Preço inválido.';
    return null;
  }

  function handleSave() {
    const err = validate();
    if (err) { setError(err); return; }

    setSaving(true);
    setTimeout(() => {
      const newGame = {
        id: nextId++,
        title: form.title.trim(),
        emoji: form.emoji,
        platform: form.platform,
        genre: form.genre,
        ttbMain: Number(form.ttbMain),
        ttbFull: Number(form.ttbFull) || Number(form.ttbMain),
        price: Number(form.price),
        status: form.status,
        metacritic: Number(form.metacritic) || 75,
      };
      onSave(newGame);
      onClose();
    }, 400);
  }

  function handleKey(e) {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose} onKeyDown={handleKey}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <span className="modal-tag">NOVO JOGO</span>
            Adicionar à Biblioteca
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Emoji picker row */}
          <div className="form-group">
            <div className="form-label">ÍCONE</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => set('emoji', e)}
                  style={{
                    fontSize: 18, padding: '4px 8px',
                    background: form.emoji === e ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                    border: `1px solid ${form.emoji === e ? 'var(--accent)' : 'var(--border-hi)'}`,
                    borderRadius: 2, cursor: 'pointer',
                    transition: 'all 80ms ease',
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="form-group">
            <label className="form-label">NOME DO JOGO *</label>
            <input
              className="form-input"
              placeholder="ex: Elden Ring"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-row form-row-2">
            {/* Platform */}
            <div className="form-group">
              <label className="form-label">PLATAFORMA</label>
              <select className="form-select" value={form.platform} onChange={e => set('platform', e.target.value)}>
                {PLATAFORMAS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            {/* Genre */}
            <div className="form-group">
              <label className="form-label">GÊNERO</label>
              <select className="form-select" value={form.genre} onChange={e => set('genre', e.target.value)}>
                {GENEROS.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row form-row-2">
            {/* HLTB Main */}
            <div className="form-group">
              <label className="form-label">HORAS PRA ZERAR (HLTB) *</label>
              <input
                className="form-input"
                placeholder="ex: 55"
                type="number"
                min="0"
                value={form.ttbMain}
                onChange={e => set('ttbMain', e.target.value)}
              />
              <div className="form-hint">// HowLongToBeat.com</div>
            </div>
            {/* HLTB Full */}
            <div className="form-group">
              <label className="form-label">HORAS 100% (OPCIONAL)</label>
              <input
                className="form-input"
                placeholder="ex: 133"
                type="number"
                min="0"
                value={form.ttbFull}
                onChange={e => set('ttbFull', e.target.value)}
              />
            </div>
          </div>

          <div className="form-row form-row-2">
            {/* Price */}
            <div className="form-group">
              <label className="form-label">PREÇO (R$) *</label>
              <input
                className="form-input"
                placeholder="ex: 249.90"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={e => set('price', e.target.value)}
              />
            </div>
            {/* Metacritic */}
            <div className="form-group">
              <label className="form-label">METACRITIC (0–100)</label>
              <input
                className="form-input"
                placeholder="ex: 96"
                type="number"
                min="0"
                max="100"
                value={form.metacritic}
                onChange={e => set('metacritic', e.target.value)}
              />
            </div>
          </div>

          {/* Status */}
          <div className="form-group">
            <label className="form-label">STATUS INICIAL</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {STATUS_OPTS.map(s => (
                <button
                  key={s.value}
                  onClick={() => set('status', s.value)}
                  style={{
                    flex: 1, padding: '7px 0', fontSize: 12, fontWeight: 500,
                    border: `1px solid ${form.status === s.value ? 'var(--accent)' : 'var(--border-hi)'}`,
                    background: form.status === s.value ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                    color: form.status === s.value ? 'var(--accent)' : 'var(--text-secondary)',
                    borderRadius: 2, cursor: 'pointer', transition: 'all 80ms ease',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--red)',
              background: 'var(--red-dim)', border: '1px solid var(--red-border)',
              padding: '8px 12px', borderRadius: 2,
            }}>
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ opacity: saving ? 0.6 : 1 }}
            id="btn-save-game"
          >
            {saving ? '[SALVANDO...]' : '+ Salvar Jogo'}
          </button>
        </div>
      </div>
    </div>
  );
}
