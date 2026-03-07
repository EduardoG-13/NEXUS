# BacklogBurner 🔥

> **Otimize seu lazer. Queime o backlog. Calcule o ROI da diversão.**

MVP de Micro SaaS para gestão inteligente de biblioteca de jogos.

---

## Funcionalidades

| Feature | Descrição |
|---|---|
| **Centro de Comando** | Dashboard com Backlog Score, Missão do Dia e estatísticas |
| **Biblioteca** | Gestão com filtros de tempo, busca e botão 🔥 QUEIMAR |
| **Compra Inteligente** | ROI Calculator — Custo por Hora de Lazer |
| **Configurações** | Perfil, plataformas, tema |
| **O Oráculo** | Chat tático: recomendações, preços e análise de ROI |

## Stack

- **Vite** + **React 18** + **CSS puro**
- Fontes: **JetBrains Mono** + **DM Sans**

## Rodando localmente

```bash
npm install
npm run dev
# http://localhost:5173
```

## Deploy no Netlify via GitHub

```bash
# 1. Push para o GitHub
git init
git add .
git commit -m "feat: BacklogBurner MVP v3"
git remote add origin https://github.com/SEU_USUARIO/backlog-burner.git
git push -u origin main
```

```
# 2. Netlify
→ app.netlify.com → "Add new site" → "Import an existing project"
→ Conectar GitHub → selecionar repositório backlog-burner
→ Build command: npm run build
→ Publish directory: dist
→ Deploy!
```

O `netlify.toml` e `public/_redirects` já estão configurados para SPA.

---

*BacklogBurner v3.0 · Hackathon Pitch*
