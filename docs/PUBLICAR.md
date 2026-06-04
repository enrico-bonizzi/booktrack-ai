# 🚀 Publicar no GitHub e vincular ao LinkedIn

## 1) Inicializar e publicar no GitHub

```bash
cd booktrack-ai

git init
git add .
git commit -m "feat: estrutura inicial do BookTrack AI"
git branch -M main

# Crie o repositório vazio em https://github.com/new com o nome "booktrack-ai"
git remote add origin https://github.com/enrico-bonizzi/booktrack-ai.git
git push -u origin main
```

## 2) Configurar o repositório

- **Sobre (About):** "Painel inteligente de acompanhamento de leitura com IA — FastAPI + React + PostgreSQL"
- **Topics:** `fastapi`, `react`, `typescript`, `postgresql`, `ai`, `python`, `tailwindcss`, `docker`
- **Website:** link da demo (Vercel/Railway/Render) quando tiver
- Ative **Issues** e **Discussions**

## 3) Subir uma demo (opcional, mas recomendado)

| Serviço | O que sobe | Free tier |
|--------|------------|-----------|
| [Railway](https://railway.app) | Backend + Postgres | ✅ |
| [Render](https://render.com) | Backend + Postgres | ✅ |
| [Vercel](https://vercel.com) | Frontend | ✅ |
| [Fly.io](https://fly.io) | Backend | ✅ |

## 4) Adicionar ao LinkedIn

1. Vá em **Perfil → Adicionar seção → Destaques → Projetos**.
2. Preencha:
   - **Nome:** `BookTrack AI — Painel Inteligente de Acompanhamento de Leitura`
   - **URL do projeto:** link do GitHub e/ou da demo
   - **Descrição (copie/adapte):**

> Aplicação web full-stack para acompanhamento inteligente de leitura. Backend em FastAPI + PostgreSQL, frontend em React + TypeScript + TailwindCSS, integração com Google Books API e enriquecimento automático de metadados via IA. Conta com cálculo de progresso, previsão de conclusão e dashboard visual.
>
> **Stack:** Python, FastAPI, SQLAlchemy, React, TypeScript, Vite, TailwindCSS, PostgreSQL, Docker.

3. Adicione também como **publicação no feed** com 2–3 prints do dashboard.

## 5) Próximos passos sugeridos

- [ ] Adicionar autenticação (JWT)
- [ ] Implementar tela de metas mensais
- [ ] Gerar PDF de relatório de leitura
- [ ] Adicionar testes E2E (Playwright)
- [ ] Configurar GitHub Actions para CI
