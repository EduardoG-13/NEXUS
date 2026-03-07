// Login Page — "The Gate"
export default function LoginPage({ onLogin }) {
  return (
    <div className="login-page">
      {/* Left Art Panel */}
      <div className="login-art">
        <div className="login-art-content">
          <div className="art-tagline">// backlogburner.gg</div>
          <h1 className="art-headline">
            Seu tempo é seu<br />
            <span>ativo mais valioso.</span><br />
            Pare de desperdiçá-lo<br />
            na biblioteca.
          </h1>
          <div className="art-stat-row">
            <div className="art-stat">
              <div className="art-stat-num">4.2h</div>
              <div className="art-stat-label">Backlog médio / semana</div>
            </div>
            <div className="art-stat">
              <div className="art-stat-num">R$847</div>
              <div className="art-stat-label">Capital parado / gamer</div>
            </div>
            <div className="art-stat">
              <div className="art-stat-num">73%</div>
              <div className="art-stat-label">Jogos nunca zerados</div>
            </div>
          </div>
        </div>
        <div className="art-footer">
          BACKLOGBURNER v2.0 · MVP PITCH DEMO · 2026
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="login-panel">
        <div className="login-form-wrap">
          <div className="login-brand">
            <div className="brand-mark">B</div>
            <div>
              <div className="brand-text">BacklogBurner</div>
              <div className="brand-version">BETA — ACESSO ANTECIPADO</div>
            </div>
          </div>

          <h2 className="login-heading">Entre na plataforma</h2>
          <p className="login-sub">Conecte sua conta e comece a otimizar seu lazer.</p>

          <button
            className="btn-steam"
            onClick={() => onLogin('steam')}
            id="btn-connect-steam"
          >
            <span style={{ fontSize: 16 }}>🎮</span>
            Conectar com Steam
          </button>

          <div className="login-divider"><span>ou</span></div>

          <button
            className="btn-email"
            onClick={() => onLogin('email')}
            id="btn-login-email"
          >
            <span style={{ fontSize: 14 }}>📧</span>
            Entrar com E-mail
          </button>

          <p className="login-legal">
            Ao entrar você concorda com os{' '}
            <strong>Termos de Serviço</strong> e{' '}
            <strong>Política de Privacidade</strong>.<br />
            Dados de plataformas lidos via OAuth — nunca armazenamos senhas.
          </p>
        </div>
      </div>
    </div>
  );
}
