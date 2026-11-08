import os


class Settings:
    def __init__(self) -> None:
        self.database_url = os.getenv(
            "DATABASE_URL", "postgresql+psycopg2://shop:shop@localhost:5432/shop"
        )
        # --- OpenRouter (free models) ---
        self.openrouter_api_key = os.getenv("OPENROUTER_API_KEY", "").strip()
        models = os.getenv(
            "OPENROUTER_MODELS",
            "openrouter/free,meta-llama/llama-3.3-70b-instruct:free,google/gemma-3-27b-it:free",
        )
        # Models are tried in order until one answers.
        self.openrouter_models = [m.strip() for m in models.split(",") if m.strip()]
        self.site_url = os.getenv("SITE_URL", "http://localhost:3000")
        self.site_name = os.getenv("SITE_NAME", "Dukaan")
        self.cors_origins = [
            o.strip()
            for o in os.getenv(
                "CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
            ).split(",")
            if o.strip()
        ]
        # --- Shop rules ---
        self.free_shipping_threshold = 5000
        self.shipping_fee = 250


settings = Settings()
