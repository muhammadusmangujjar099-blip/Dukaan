# Dukaan — Smart E-Commerce Platform with an AI Sales Assistant

A full-stack store where a floating assistant turns plain language
(*"phone under 20,000"*, *"laptop 1 lakh se kam"*) into database filters and shows real products.

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn-style UI, Zustand (cart + chat) |
| Backend | FastAPI, SQLAlchemy 2, Pydantic v2 |
| Database | PostgreSQL 16 (products, categories, orders, order_items) |
| AI | OpenRouter **free** models (key-based, model fallback list) |
| Infra | Docker Compose |

## Quick start (Roman Urdu)

1. OpenRouter se free key banao: https://openrouter.ai/keys
2. `cp .env.example .env` aur `OPENROUTER_API_KEY=` ke samne apni key paste karo.
3. `docker compose up --build`
4. Store: http://localhost:3000 — API docs: http://localhost:8000/docs

Bina key ke bhi assistant chalta hai (rule-based parser), bas jawab itne natural nahi hote.

## How the AI assistant works

```
user message ──► FastAPI /api/chat
                   │ 1. OpenRouter LLM → JSON {intent, filters}
                   │ 2. Pydantic validates filters (category/brand must exist in DB)
                   │ 3. Rule parser double-checks prices ("20 hazar", "1 lakh", "under 20k")
                   │ 4. SQLAlchemy builds a parameterised query  ← the LLM never writes SQL
                   │ 5. LLM writes a short reply about the real results
                   ▼
         reply + product cards (+ link to open the same filters in the store)
```

* **Safe by design:** the model only fills a typed `ProductFilters` object; the same
  query builder serves the REST endpoint and the assistant.
* **Follow-ups work:** the last filters are sent back, so *"isse sasta dikhao"* refines the previous search.
* **Resilient:** models in `OPENROUTER_MODELS` are tried in order; if all fail, the rule-based parser answers.
* **Smart relaxing:** if keywords return nothing, the search widens to category + budget.

Free model names on OpenRouter change over time — if replies fall back to the rule parser,
check https://openrouter.ai/models?q=free and update `OPENROUTER_MODELS` in `.env`.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/categories` | categories with product counts |
| GET | `/api/products` | `q, category, brand, min_price, max_price, min_rating, in_stock, sort, page, page_size` |
| GET | `/api/products/{id}` | single product |
| POST | `/api/orders` | place order (prices + stock checked server-side, rows locked) |
| GET | `/api/orders/{id}` | order details |
| POST | `/api/chat` | AI assistant |
| GET | `/api/health` | status (`ai: openrouter \| fallback`) |

## Run without Docker

```bash
# database
docker run -d --name shop-db -e POSTGRES_USER=shop -e POSTGRES_PASSWORD=shop -e POSTGRES_DB=shop -p 5432:5432 postgres:16-alpine

# backend
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export OPENROUTER_API_KEY=sk-or-...
uvicorn app.main:app --reload            # tables + sample data are created on first start

# frontend
cd frontend && npm install && npm run dev
```

Backend tests: `cd backend && pytest`

## Project layout

```
backend/app/    main.py · models.py · schemas.py · seed.py
                routers/ (products, orders, chat) · services/ (search, ai, heuristics)
frontend/       app/ (pages) · components/ · store/ (cart, chat) · lib/
docker-compose.yml
```

## Notes

* Prices in the seed data are illustrative (PKR).
* Payment is cash on delivery; delivery is free over Rs 5,000, otherwise Rs 250.
* Tables are created automatically on startup. For production add Alembic migrations.
