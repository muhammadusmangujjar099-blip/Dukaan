from app.services.heuristics import extract_price, parse_query

SLUGS = {"mobiles", "laptops", "audio", "watches", "gaming", "home"}
BRANDS = ["Samsung", "Xiaomi", "Sony"]


def test_under_with_commas():
    assert extract_price("best phone under 20,000") == (None, 20000)


def test_k_suffix():
    assert extract_price("budget 20k") == (None, 20000)


def test_roman_urdu_hazar():
    assert extract_price("20 hazar ke andar mobile") == (None, 20000)


def test_lakh():
    assert extract_price("laptop 1 lakh se kam") == (None, 100000)
    assert extract_price("under 1.5 lakh") == (None, 150000)


def test_range():
    assert extract_price("headphones between 5k and 15k") == (5000, 15000)
    assert extract_price("phone 20000-40000") == (20000, 40000)


def test_min():
    assert extract_price("laptop above 100000") == (100000, None)


def test_specs_are_not_prices():
    assert extract_price("samsung 5000mah phone") == (None, None)
    assert extract_price("iphone 15 128gb") == (None, None)


def test_parse_query_full():
    got = parse_query("Samsung mobile 25 hazar tak sasta", SLUGS, BRANDS)
    assert got == {
        "category": "mobiles",
        "brand": "Samsung",
        "max_price": 25000,
        "sort": "price_asc",
    }


def test_gaming_laptop_is_laptops():
    assert parse_query("gaming laptop", SLUGS, BRANDS)["category"] == "laptops"
