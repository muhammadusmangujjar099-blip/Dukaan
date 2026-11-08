import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError

from .config import settings
from .database import Base, SessionLocal, engine
from .routers import chat, orders, products
from .seed import seed_if_empty

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("dukaan")


@asynccontextmanager
async def lifespan(_: FastAPI):
    for attempt in range(30):  # wait for Postgres on cold start
        try:
            Base.metadata.create_all(bind=engine)
            break
        except OperationalError:
            log.info("database not ready (%s/30)...", attempt + 1)
            time.sleep(2)
    with SessionLocal() as db:
        seed_if_empty(db)
    if not settings.openrouter_api_key:
        log.warning("OPENROUTER_API_KEY not set - assistant uses the rule-based fallback")
    yield


app = FastAPI(title="Dukaan API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(chat.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok", "ai": "openrouter" if settings.openrouter_api_key else "fallback"}
