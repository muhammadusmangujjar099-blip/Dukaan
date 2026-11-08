"""Sample catalogue (prices in PKR, illustrative). Runs once on an empty DB."""
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import Category, Product

CATEGORIES = [
    ("Mobiles", "mobiles", "📱"),
    ("Laptops", "laptops", "💻"),
    ("Audio", "audio", "🎧"),
    ("Smartwatches", "watches", "⌚"),
    ("Gaming", "gaming", "🎮"),
    ("Home & Kitchen", "home", "🍳"),
]

# name, brand, category, price, original_price, stock, rating, reviews, tags, description
PRODUCTS = [
    # --- mobiles ---
    ("Tecno Spark Go 1", "Tecno", "mobiles", 16499, 18999, 40, 4.1, 212, "budget,android,5000mah", "6.67\" 90Hz display, 5000mAh battery and a 13MP camera. A dependable first smartphone."),
    ("Infinix Smart 8", "Infinix", "mobiles", 18999, 21999, 35, 4.2, 340, "budget,android,5000mah", "Octa-core processor, 6.6\" screen and a big 5000mAh battery that lasts two days."),
    ("Itel P55", "Itel", "mobiles", 19500, None, 28, 4.0, 128, "budget,android,fast-charging", "18W fast charging, 128GB storage and a clean Android experience."),
    ("Infinix Hot 40 Pro", "Infinix", "mobiles", 31999, 35999, 22, 4.3, 410, "gaming,android,120hz", "Helio G99 chipset with a 120Hz screen. Smooth for games and social apps."),
    ("Tecno Spark 20 Pro", "Tecno", "mobiles", 29999, 33999, 30, 4.2, 296, "camera,android,amoled", "108MP camera and a bright display at a mid-range price."),
    ("Samsung Galaxy A15", "Samsung", "mobiles", 42999, 46999, 25, 4.4, 520, "samsung,amoled,android", "Super AMOLED screen, 6 years of updates and a 50MP camera."),
    ("Xiaomi Redmi Note 13", "Xiaomi", "mobiles", 49999, 54999, 18, 4.5, 689, "camera,amoled,fast-charging", "200MP-class camera and a 120Hz AMOLED screen. Great value for money."),
    ("Realme C67", "Realme", "mobiles", 38999, None, 20, 4.2, 187, "camera,android,fast-charging", "Snapdragon 685, 108MP camera and 33W fast charging."),
    ("Samsung Galaxy S24 FE", "Samsung", "mobiles", 189999, 199999, 8, 4.7, 143, "flagship,samsung,5g", "Flagship performance, a pro-grade camera system and an all-day battery."),
    ("Apple iPhone 15 128GB", "Apple", "mobiles", 259999, None, 6, 4.8, 301, "flagship,ios,5g", "A16 Bionic chip, Dynamic Island and a 48MP main camera."),
    # --- laptops ---
    ("ASUS Vivobook Go 15", "ASUS", "laptops", 79999, 84999, 12, 4.1, 96, "student,ryzen,lightweight", "Ryzen 5, 8GB RAM, 512GB SSD. A light everyday laptop for study and office."),
    ("HP 15s Core i3 12th Gen", "HP", "laptops", 89999, 94999, 14, 4.2, 154, "student,office,intel", "Core i3, 8GB RAM, 256GB SSD and a 15.6\" anti-glare display."),
    ("Lenovo IdeaPad Slim 3 Ryzen 5", "Lenovo", "laptops", 119999, 129999, 10, 4.5, 210, "ryzen,thin,office", "Ryzen 5 7520U, 16GB RAM, 512GB SSD. Fast enough for multitasking."),
    ("Dell Inspiron 15 Core i5", "Dell", "laptops", 149999, 159999, 9, 4.4, 133, "intel,office,business", "Core i5 13th gen, 16GB RAM and a 512GB SSD in a sturdy chassis."),
    ("ASUS TUF Gaming F15 RTX 3050", "ASUS", "laptops", 229999, 249999, 5, 4.6, 88, "gaming,rtx,144hz", "RTX 3050 graphics, 144Hz display and military-grade durability."),
    ("Apple MacBook Air M2", "Apple", "laptops", 279999, None, 6, 4.9, 176, "apple,m2,lightweight", "M2 chip, fanless design and up to 18 hours of battery."),
    # --- audio ---
    ("Haylou GT1 Pro Earbuds", "Haylou", "audio", 3499, 4499, 80, 4.0, 410, "budget,earbuds,bluetooth", "Bluetooth 5.2 earbuds with 24 hours of total playtime."),
    ("Xiaomi Redmi Buds 5", "Xiaomi", "audio", 6499, 7499, 60, 4.3, 275, "earbuds,anc,bluetooth", "Active noise cancellation and 40 hours of playtime with the case."),
    ("JBL Tune 520BT Headphones", "JBL", "audio", 11999, 13999, 30, 4.5, 360, "headphones,bass,wireless", "JBL Pure Bass sound and 57 hours of battery life."),
    ("Sony WH-CH520", "Sony", "audio", 13999, 15999, 24, 4.4, 220, "headphones,wireless,lightweight", "Lightweight on-ear headphones with 50 hours of battery."),
    ("Anker Soundcore Q20i", "Anker", "audio", 14999, 17999, 18, 4.5, 198, "headphones,anc,wireless", "Hybrid active noise cancelling with up to 60 hours of playtime."),
    ("JBL Flip 6 Speaker", "JBL", "audio", 28999, 32999, 15, 4.7, 244, "speaker,waterproof,portable", "IP67 waterproof portable speaker with powerful bass."),
    # --- watches ---
    ("Xiaomi Smart Band 8", "Xiaomi", "watches", 7499, 8499, 50, 4.5, 530, "fitness,band,amoled", "1.62\" AMOLED, 16-day battery and 150+ sport modes."),
    ("Haylou Solar Plus", "Haylou", "watches", 8999, 10999, 26, 4.1, 143, "smartwatch,amoled,calls", "AMOLED display with Bluetooth calling and heart-rate tracking."),
    ("Amazfit Bip 5", "Amazfit", "watches", 14999, 17999, 20, 4.4, 167, "smartwatch,gps,battery", "Large display, built-in GPS and up to 10 days of battery."),
    ("Apple Watch SE (2nd Gen)", "Apple", "watches", 79999, 84999, 7, 4.8, 119, "apple,smartwatch,health", "Crash detection, fitness tracking and a bright Retina display."),
    # --- gaming ---
    ("Logitech G102 Mouse", "Logitech", "gaming", 4999, 5999, 70, 4.6, 890, "mouse,rgb,budget", "8,000 DPI sensor with customisable RGB lighting."),
    ("Redragon K552 Keyboard", "Redragon", "gaming", 9999, 11999, 33, 4.6, 612, "keyboard,mechanical,compact", "Compact mechanical keyboard with RGB backlight."),
    ("HyperX Cloud Stinger 2", "HyperX", "gaming", 12999, 14999, 21, 4.4, 204, "headset,gaming,lightweight", "Lightweight gaming headset with a clear 50mm driver."),
    ("Xbox Wireless Controller", "Microsoft", "gaming", 14999, None, 19, 4.7, 322, "controller,pc,console", "Works with Xbox, PC and mobile over Bluetooth."),
    ("PlayStation 5 Slim", "Sony", "gaming", 189999, 199999, 4, 4.9, 97, "console,ps5,4k", "4K gaming console with an ultra-fast SSD."),
    # --- home ---
    ("Anex Hand Blender", "Anex", "home", 4299, 4999, 55, 4.2, 301, "blender,kitchen,budget", "400W hand blender for smoothies, soups and sauces."),
    ("Philips Electric Kettle 1.7L", "Philips", "home", 6499, 7499, 38, 4.5, 256, "kettle,kitchen,stainless", "Stainless-steel kettle with auto shut-off."),
    ("Dawlance Air Fryer 4L", "Dawlance", "home", 21999, 24999, 17, 4.3, 188, "air-fryer,kitchen,healthy", "4L digital air fryer for crispy food with little oil."),
    ("Philips Air Fryer 4.1L", "Philips", "home", 34999, 38999, 12, 4.7, 340, "air-fryer,kitchen,healthy", "Rapid Air technology for fast, evenly cooked meals."),
    ("Xiaomi Robot Vacuum E10", "Xiaomi", "home", 45999, 51999, 9, 4.4, 121, "vacuum,smart-home,robot", "Smart-mapping robot vacuum with app control and mopping."),
]


def seed_if_empty(db: Session) -> None:
    if db.execute(select(func.count(Category.id))).scalar_one():
        return
    cats = {}
    for name, slug, emoji in CATEGORIES:
        cats[slug] = Category(name=name, slug=slug, emoji=emoji)
        db.add(cats[slug])
    db.flush()
    for name, brand, cat, price, orig, stock, rating, reviews, tags, desc in PRODUCTS:
        db.add(
            Product(
                name=name, brand=brand, category_id=cats[cat].id, price=price,
                original_price=orig, stock=stock, rating=rating, review_count=reviews,
                tags=tags, description=desc,
            )
        )
    db.commit()
