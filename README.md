# 📚 BookTrack AI

> Painel inteligente de acompanhamento de leitura com IA, login Google, gráficos de evolução e galeria de imagens.

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6.svg)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-38BDF8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

## ✨ Visão geral

O **BookTrack AI** é uma aplicação web **full-stack** desenvolvida para auxiliar leitores a acompanharem seu progresso de leitura de forma simples, visual e automatizada.

Além do controle tradicional de páginas lidas, o sistema utiliza **Inteligência Artificial** (Claude / OpenAI) e APIs externas (Google Books, Open Library) para enriquecer a experiência do usuário, buscando automaticamente informações sobre os livros e exibindo suas capas.

## 🎯 Funcionalidades

### 🔐 Autenticação
- Login com **Google OAuth 2.0** — cada usuário enxerga apenas seus próprios livros
- JWT com expiração de 30 dias

### 📖 Gestão de livros
- Cadastro com **enriquecimento automático via IA** (busca capa, sinopse, total de páginas)
- Edição completa em formulário dedicado
- Estados: *não iniciado* (lista de desejos), *em andamento*, *concluído*
- Cadastro de livros já lidos (com data de início e fim)

### 📊 Acompanhamento inteligente
- Cálculo automático de **percentual concluído**
- **Previsão de conclusão** baseada na média diária real
- **Log automático** de cada atualização de página (avanço e correções)
- Reabertura automática de livros se a página for reduzida

### 📅 Painel temporal
- Filtro por período (presets: 7d, 30d, mês, ano + intervalo custom)
- Comparativo "Leitura registrada × Conclusões no período"
- Detalhamento: avanço bruto, correções e leitura líquida

### 📈 Gráficos
- Linha do tempo de páginas lidas com **3 granularidades** (anual / mensal / semanal)
- Construído com **Recharts**, totalmente integrado ao tema do app

### 🖼️ Galeria de imagens
- **Upload por arquivo** (drag-and-drop ou seletor) — JPG/PNG/WEBP/GIF, até 5 MB
- **Adição por URL** (modo alternativo)
- Legendas opcionais

### 🤖 Pipeline de busca de metadados
Acionado em sequência até preencher todos os campos:
1. **Google Books API** (top 5, melhor score)
2. **Open Library Search** (top 5, melhor score)
3. **Merge** inteligente — pega o melhor campo de cada fonte
4. Se faltar `total_pages` e tiver ISBN → consulta direta `/isbn/{isbn}` no Open Library
5. Re-consulta Google Books por `q=isbn:`
6. **Fallback IA** (Claude 3.5 Haiku → OpenAI GPT-4o-mini) para o que faltar
7. Capa por ISBN no Open Library Covers se nenhuma fonte trouxe

### 🌓 Tema claro / escuro
- Detecta automaticamente o `prefers-color-scheme` do sistema
- Toggle manual persistido em `localStorage`
- Script inline no `index.html` evita flash branco no carregamento

### 📱 Mobile-first
- Layout responsivo testado em iPhone SE até desktop 4K
- Navbar com menu hambúrguer
- Carrossel touch-friendly
- Inputs com tamanho que evita zoom no iOS

---

## 🛠️ Stack técnica

| Camada | Tecnologias |
|--------|-------------|
| **Backend** | Python 3.11, FastAPI, SQLAlchemy 2, Pydantic v2 |
| **Frontend** | React 18, TypeScript, Vite, **Tailwind CSS v4** (CSS variables + design tokens), Recharts |
| **Banco** | SQLite (dev) · PostgreSQL (prod) |
| **Auth** | Google OAuth 2.0 + JWT (PyJWT + google-auth) |
| **IA** | Anthropic Claude 3.5 Haiku · OpenAI GPT-4o-mini |
| **DevOps** | Docker, Docker Compose, GitHub Actions ready |

---

## 📂 Estrutura do projeto

```
booktrack-ai/
├── backend/
│   ├── app/
│   │   ├── api/             # Rotas: auth, books, ai
│   │   ├── core/            # Config, database, security (JWT)
│   │   ├── models/          # SQLAlchemy: User, Book, BookImage, ReadingLog
│   │   ├── schemas/         # Pydantic
│   │   └── services/        # google_books (pipeline), ai_fallback, progress, timeseries
│   ├── scripts/reset_db.py  # Reset rápido do SQLite em dev
│   ├── uploads/             # Imagens enviadas pelos usuários
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, BookCard, BookCarousel, ReadingChart, etc.
│   │   ├── contexts/        # AuthContext, ThemeContext
│   │   ├── pages/           # Dashboard, BookList, BookForm, BookDetail, Login
│   │   ├── services/        # api.ts (axios interceptors)
│   │   └── types/
│   ├── index.html
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## ⚙️ Como executar

### Pré-requisitos
- Python 3.11+
- Node.js 20+
- Conta no [Google Cloud Console](https://console.cloud.google.com/) (para OAuth)
- (Opcional) Chave da [Anthropic](https://console.anthropic.com/) ou [OpenAI](https://platform.openai.com/) para o fallback IA
- (Opcional) Docker e Docker Compose

### 🐳 Com Docker

```bash
git clone https://github.com/<seu-usuario>/booktrack-ai.git
cd booktrack-ai
cp .env.example .env
# Edite .env e preencha: GOOGLE_OAUTH_CLIENT_ID, JWT_SECRET, ANTHROPIC_API_KEY (opcional)
docker-compose up --build
```

### 🔧 Manual (recomendado em dev)

**Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python scripts/reset_db.py    # cria o SQLite com o schema atual
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

URLs:
- 🟢 API: http://localhost:8000
- 📘 Swagger docs: http://localhost:8000/docs
- 🔵 App: http://localhost:5173

---

## 🔑 Variáveis de ambiente

### `backend/.env`
```env
DATABASE_URL=sqlite:///./booktrack.db
CORS_ORIGINS=http://localhost:5173

# Google OAuth (obrigatório)
GOOGLE_OAUTH_CLIENT_ID=...apps.googleusercontent.com

# JWT (obrigatório — gere com: python -c "import secrets; print(secrets.token_urlsafe(32))")
JWT_SECRET=...

# Opcionais — só impactam o fallback IA
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...
GOOGLE_BOOKS_API_KEY=AIza...
```

### `frontend/.env`
```env
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=...apps.googleusercontent.com
```

### Setup do Google OAuth
1. Acesse https://console.cloud.google.com/apis/credentials
2. **Create Credentials → OAuth client ID → Web application**
3. Em *Authorized JavaScript origins* adicione `http://localhost:5173`
4. Copie o **Client ID** para os dois `.env` acima (frontend e backend)

---

## 🗺️ Roadmap

- [x] CRUD de livros com login Google
- [x] Cálculo de progresso e previsão dinâmica
- [x] Pipeline multi-fonte de metadados + IA
- [x] Galeria com upload de arquivos
- [x] Gráficos de evolução com granularidades
- [x] Filtro por período comparativo
- [x] Tema claro/escuro
- [x] Responsivo mobile
- [ ] Metas mensais de leitura
- [ ] Recomendações automáticas via IA
- [ ] Exportação de relatórios em PDF
- [ ] Sincronização com Kindle
- [ ] App mobile (React Native)
- [ ] Deploy em produção (Railway/Render + Vercel)

---

## 🌟 Diferencial

O principal diferencial do **BookTrack AI** é combinar o acompanhamento tradicional de leitura com **automação baseada em IA**, reduzindo o preenchimento manual e oferecendo uma experiência rica, visual e mobile-first.

---

## 📄 Licença

MIT — veja [`LICENSE`](LICENSE).

---

## 👤 Autor

**Enrico Bonizzi**

- 🔗 [LinkedIn](https://www.linkedin.com/in/enricobonizzi/)
- 💻 [GitHub](https://github.com/enricobonizzi)
- ✉️ enricobonizzi@gmail.com

> Desenvolvedor de Software no Grupo Sifra • Pós-graduado em Gestão e Análise Estratégica de Dados
