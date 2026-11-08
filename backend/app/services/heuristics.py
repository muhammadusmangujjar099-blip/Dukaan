"""Rule-based query understanding.

Used (a) to double-check the numbers the LLM extracts and (b) as a complete
fallback when OpenRouter is unreachable / no API key is set, so the assistant
keeps working. Understands English + Roman Urdu: "20 hazar", "1 lakh",
"20,000 ke andar", "under 20k".
"""
import re

UNITS = {
    "k": 1_000, "thousand": 1_000, "hazar": 1_000, "hazaar": 1_000,
    "lakh": 100_000, "lakhs": 100_000, "lac": 100_000, "lacs": 100_000,
    "million": 1_000_000,
}
_UNIT_RE = "|".join(sorted(UNITS, key=len, reverse=True))
_NUM = rf"(\d{{1,3}}(?:,\d{{3}})+|\d+(?:\.\d+)?)\s*({_UNIT_RE})?"
NUM_RE = re.compile(rf"{_NUM}\b")
RANGE_RE = re.compile(rf"{_NUM}\s*(?:to|and|-|–|se)\s*{_NUM}\b")

MAX_BEFORE = re.compile(
    r"(under|below|less than|upto|up to|within|budget|max|maximum|cheaper than|not more than|<=?)\s*(rs\.?|pkr|rupees)?\s*$"
)
MAX_AFTER = re.compile(
    r"^\s*(rs\.?|pkr|rupees|rupay|rupaye)?\s*(tak|se kam|se kum|ke andar|k andar|andar|ke ander|ander|or less|and below|ya kam|se neeche|max|maximum)\b"
)
MIN_BEFORE = re.compile(
    r"(over|above|more than|at least|minimum|min|greater than|>=?)\s*(rs\.?|pkr|rupees)?\s*$"
)
MIN_AFTER = re.compile(
    r"^\s*(rs\.?|pkr|rupees)?\s*(se zyada|se ziada|se upar|se oper|se ooper|ke upar|or more|and above|plus|\+)"
)
AROUND_BEFORE = re.compile(r"(around|about|approx|approximately|roughly|lagbhag)\s*(rs\.?|pkr)?\s*$")
RS_BEFORE = re.compile(r"(rs\.?|pkr|rupees)\s*$")
SPEC_AFTER = re.compile(r"^\s*(mah|gb|tb|mp|inch|hz|w\b|ram|fps)")

# first match wins -> order matters ("gaming laptop" must resolve to laptops)
CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "mobiles": ["smartphone", "phone", "mobile", "iphone", "android"],
    "laptops": ["laptop", "notebook", "macbook", "ultrabook"],
    "audio": ["headphone", "earbud", "earphone", "airpod", "buds", "speaker", "audio"],
    "watches": ["smartwatch", "watch", "fitness band", "smart band"],
    "home": ["air fryer", "fryer", "blender", "kettle", "vacuum", "kitchen", "home"],
    "gaming": ["gaming", "gamepad", "controller", "console", "keyboard", "mouse", "playstation"],
}

SORT_HINTS = [
    ("price_asc", ["cheapest", "sasta", "sabse sasta", "lowest price", "low price", "cheap"]),
    ("price_desc", ["most expensive", "premium", "flagship", "mehnga", "highest price"]),
    ("rating", ["top rated", "best rated", "highest rated", "best reviews", "behtareen"]),
    ("newest", ["newest", "latest", "naya", "new arrival"]),
]


def parse_amount(num: str, unit: str | None) -> int:
    value = float(num.replace(",", ""))
    if unit:
        value *= UNITS[unit]
    return int(value)


def _range(text: str):
    m = RANGE_RE.search(text)
    if not m:
        return None
    n1, u1, n2, u2 = m.groups()
    if SPEC_AFTER.match(text[m.end():]):
        return None
    a1 = parse_amount(n1, u1 or (u2 if u2 and float(n1.replace(",", "")) < 1000 else None))
    a2 = parse_amount(n2, u2)
    if min(a1, a2) < 500:
        return None
    return min(a1, a2), max(a1, a2)


def extract_price(text: str) -> tuple[int | None, int | None]:
    t = text.lower()
    rng = _range(t)
    if rng:
        return rng

    min_p = max_p = None
    for m in NUM_RE.finditer(t):
        num, unit = m.groups()
        amount = parse_amount(num, unit)
        if amount < 500 and not unit:
            continue  # "i5", "iphone 15", "8 gb" ...
        if SPEC_AFTER.match(t[m.end():]):
            continue
        before = t[max(0, m.start() - 25): m.start()]
        after = t[m.end(): m.end() + 25]
        if MAX_BEFORE.search(before) or MAX_AFTER.match(after):
            max_p = amount
        elif MIN_BEFORE.search(before) or MIN_AFTER.match(after):
            min_p = amount
        elif AROUND_BEFORE.search(before):
            min_p, max_p = int(amount * 0.8), int(amount * 1.2)
        elif RS_BEFORE.search(before):
            max_p = amount
    return min_p, max_p


def extract_category(text: str, valid_slugs: set[str] | None = None) -> str | None:
    t = text.lower()
    for slug, words in CATEGORY_KEYWORDS.items():
        if valid_slugs is not None and slug not in valid_slugs:
            continue
        if any(w in t for w in words):
            return slug
    return None


def extract_brand(text: str, brands: list[str]) -> str | None:
    t = text.lower()
    for b in brands:
        if re.search(rf"\b{re.escape(b.lower())}\b", t):
            return b
    return None


def extract_sort(text: str) -> str | None:
    t = text.lower()
    for sort, words in SORT_HINTS:
        if any(w in t for w in words):
            return sort
    return None


def parse_query(text: str, valid_slugs: set[str], brands: list[str]) -> dict:
    min_p, max_p = extract_price(text)
    out = {
        "category": extract_category(text, valid_slugs),
        "brand": extract_brand(text, brands),
        "min_price": min_p,
        "max_price": max_p,
        "sort": extract_sort(text),
        "in_stock": True if "in stock" in text.lower() else None,
    }
    return {k: v for k, v in out.items() if v is not None}
