import argparse
import asyncio
import json
import os
import re
import sys
from datetime import datetime, timezone
from typing import Any
from urllib.parse import quote_plus, urljoin

import psycopg2
from dotenv import load_dotenv
from groq import Groq
from playwright.async_api import Browser, Page, async_playwright

load_dotenv()

DEFAULT_CATEGORIES = {
    # "Electronics": [
    #     "laptop",
    #     "mobile phone",
    #     "airpods",
    #     "smart watch",
    #     "headphones",
    #     "bluetooth speaker",
    # ],
    # "Fashion": [
    #     "men shirt",
    #     "women dress",
    #     "shoes",
    #     "handbag",
    # ],
    # "Sports": [
    #     "cricket bat",
    #     "football",
    #     "tennis racket",
    # ],
    # "Beauty": [
    #     "face wash",
    #     "perfume",
    #     "makeup kit",
    # ],
    # "Automotive": [
    #     "car accessories",
    #     "motorcycle helmet",
    #     "car phone holder",
    # ],
    # "Gaming": [
    #     "ps5",
    #     "xbox series x",
    #     "nintendo switch",
    # ],
    # "Books": [
    #     "novel book",
    #     "self-help book",
    #     "children book",
    #     "programming book",
    # ],
    # "Baby & Kids": [
    #     "kids toys",
    #     "baby stroller",
    #     "kids clothing",
    # ],
    "Home & Living": [
        "sofa",
        "dining table",
        "bed",
        "home decor",
    ],
}
DB_CONFIG = {
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
}

HEADLESS = os.getenv("SCRAPER_HEADLESS", "true").lower() not in {"0", "false", "no"}
GROQ_MODEL = os.getenv("GROQ_MODEL") or "llama-3.3-70b-versatile"


def emit(event: str, **payload: Any) -> None:
    message = {
        "event": event,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        **payload,
    }
    print("EVENT " + json.dumps(message, ensure_ascii=False), flush=True)


def clean_text(value: Any, fallback: str = "") -> str:
    if value is None:
        return fallback
    return re.sub(r"\s+", " ", str(value)).strip() or fallback


def normalize_url(base_url: str, value: str | None) -> str:
    value = clean_text(value)
    if not value:
        return ""
    if value.startswith("//"):
        return "https:" + value
    return urljoin(base_url, value)


def numeric_price(value: str) -> float | None:
    match = re.search(r"(\d+(?:,\d{3})*(?:\.\d+)?)", value or "")
    if not match:
        return None
    try:
        return float(match.group(1).replace(",", ""))
    except ValueError:
        return None


def unique_products(products: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    output: list[dict[str, Any]] = []

    for product in products:
        link = clean_text(product.get("link"))
        key = link or f"{product.get('source')}::{product.get('title')}::{product.get('price')}"
        if key in seen:
            continue
        seen.add(key)
        output.append(product)

    return output


def has_any(text: str, patterns: list[str]) -> bool:
    return any(re.search(pattern, text) for pattern in patterns)


PRODUCT_TYPE_RULES: list[dict[str, Any]] = [
    {
        "type": "handbag",
        "category": "Fashion",
        "patterns": [
            r"\bhand\s*bag\b",
            r"\bhandbag\b",
            r"\bbag\b",
            r"\bpurse\b",
            r"\bcrossbody\b",
            r"\btote\b",
            r"\bshoulder\s*bag\b",
            r"\bclutch\b",
            r"\bwallet\b",
        ],
    },
    {
        "type": "book",
        "category": "Books",
        "patterns": [
            r"\bbook\b",
            r"\bbooks\b",
            r"\bcopybook\b",
            r"\breading\b",
            r"\bnovel\b",
            r"\bmagazine\b",
            r"\bpython\b.*\bbook\b",
        ],
    },
    {
        "type": "toy",
        "category": "Baby & Kids",
        "patterns": [
            r"\btoy\b",
            r"\btoys\b",
            r"\bdiecast\b",
            r"\bmodel\s*car\b",
            r"\bcar\s*model\b",
            r"\bpull\s*back\b",
            r"\bremote\s*control\b",
            r"\brc\s*car\b",
        ],
    },
    {
        "type": "smartwatch",
        "category": "Electronics",
        "patterns": [
            r"\bsmart\s*watch\b",
            r"\bsmartwatch\b",
            r"\bwatch\b",
            r"\bwrist\s*watch\b",
            r"\btitan\s*pro\b",
        ],
    },
    {
        "type": "audio",
        "category": "Electronics",
        "patterns": [
            r"\bheadphone\b",
            r"\bheadphones\b",
            r"\bheadset\b",
            r"\bearbud\b",
            r"\bearbuds\b",
            r"\bearphone\b",
            r"\bearphones\b",
            r"\bairpods\b",
            r"\bearpods\b",
            r"\btws\b",
            r"\bbluetooth\s*speaker\b",
            r"\bspeaker\b",
        ],
    },
    {
        "type": "phone_accessory",
        "category": "Electronics",
        "patterns": [
            r"\bphone\s*holder\b",
            r"\bmobile\s*holder\b",
            r"\bphone\s*stand\b",
            r"\bmobile\s*stand\b",
            r"\bphone\s*case\b",
            r"\bmobile\s*case\b",
            r"\bphone\s*cover\b",
            r"\bmobile\s*cover\b",
            r"\bcharger\b",
            r"\bcharging\b",
            r"\bcable\b",
            r"\bpower\s*bank\b",
            r"\bmagnetic\s*holder\b",
            r"\bheadset\s*stand\b",
        ],
    },
    {
        "type": "mobile_phone",
        "category": "Electronics",
        "patterns": [
            r"\bmobile\s*phone\b",
            r"\bsmartphone\b",
            r"\biphone\b",
            r"\bsamsung\b",
            r"\bvivo\b",
            r"\boppo\b",
            r"\binfinix\b",
            r"\btecno\b",
            r"\bredmi\b",
            r"\brealme\b",
            r"\bxiaomi\b",
            r"\bnokia\b",
            r"\bitel\b",
            r"\bpta\s*approved\b",
            r"\bdual\s*sim\b",
            r"\b\d+\s*gb\s*ram\b",
            r"\b\d+\s*gb\s*rom\b",
            r"\bandroid\s*smartphone\b",
        ],
    },
    {
        "type": "laptop",
        "category": "Electronics",
        "patterns": [
            r"\blaptop\b",
            r"\blaptops\b",
            r"\bnotebook\b",
            r"\bmacbook\b",
            r"\bchromebook\b",
        ],
    },
    {
        "type": "fashion_clothing",
        "category": "Fashion",
        "patterns": [
            r"\bshirt\b",
            r"\bdress\b",
            r"\bjeans\b",
            r"\bshoe\b",
            r"\bshoes\b",
            r"\bsneaker\b",
            r"\bsneakers\b",
            r"\bclothing\b",
        ],
    },
    {
        "type": "beauty",
        "category": "Beauty",
        "patterns": [
            r"\bmakeup\b",
            r"\bface\s*wash\b",
            r"\bperfume\b",
            r"\bskincare\b",
            r"\bskin\s*care\b",
            r"\blipstick\b",
            r"\bserum\b",
        ],
    },
    {
        "type": "sports",
        "category": "Sports",
        "patterns": [
            r"\bcricket\b",
            r"\bfootball\b",
            r"\btennis\b",
            r"\bfitness\b",
            r"\bgym\b",
            r"\bracket\b",
            r"\bracquet\b",
        ],
    },
    {
        "type": "home_living",
        "category": "Home & Living",
        "patterns": [
            r"\bsofa\b",
            r"\bbed\b",
            r"\bdining\b",
            r"\bfurniture\b",
            r"\bdecor\b",
            r"\bhome\s*decor\b",
        ],
    },
]


QUERY_TYPE_RULES = {
    "mobile_phone": [
        r"\bmobile\s*phone\b",
        r"\bmobile\b",
        r"\bphone\b",
        r"\bsmartphone\b",
        r"\biphone\b",
        r"\bsamsung\b",
        r"\bvivo\b",
        r"\boppo\b",
        r"\binfinix\b",
        r"\btecno\b",
        r"\bredmi\b",
        r"\brealme\b",
        r"\bxiaomi\b",
        r"\bnokia\b",
        r"\bitel\b",
    ],
    "book": [r"\bbook\b", r"\bbooks\b", r"\bcopybook\b", r"\breading\b"],
    "toy": [r"\btoy\b", r"\btoys\b", r"\bkids\s*toy\b", r"\bchildren\s*toy\b"],
    "audio": [
        r"\bheadphone\b",
        r"\bheadphones\b",
        r"\bearbud\b",
        r"\bearbuds\b",
        r"\bairpods\b",
        r"\bspeaker\b",
    ],
    "smartwatch": [r"\bsmart\s*watch\b", r"\bsmartwatch\b", r"\bwatch\b"],
    "laptop": [r"\blaptop\b", r"\blaptops\b", r"\bnotebook\b"],
    "handbag": [r"\bhandbag\b", r"\bhand\s*bag\b", r"\bbag\b", r"\bpurse\b"],
}


def infer_query_type(query: str) -> str:
    text = normalize_text_for_matching(query)

    for product_type, patterns in QUERY_TYPE_RULES.items():
        if has_any(text, patterns):
            return product_type

    return ""


def normalize_text_for_matching(value: Any) -> str:
    return normalize_text(value)


def normalize_text(value: Any) -> str:
    return clean_text(value).lower()


def infer_product_type(title: str, query: str = "", category: str = "") -> str:
    text = normalize_text_for_matching(f"{title} {category}")
    query_type = infer_query_type(query)

    # Real laptop first
    if re.search(
        r"\b(laptop|notebook|macbook|chromebook|latitude|thinkpad|ideapad|inspiron|pavilion|elitebook|probook|surface\s*laptop|dynabook|portege)\b",
        text,
    ) and re.search(
        r"\b(core\s*i3|core\s*i5|core\s*i7|core\s*i9|ryzen|celeron|pentium|intel|amd|\d+\s*gb\s*ram|\d+\s*gb\s*ssd|\d+\s*gb\s*hdd|ssd|hdd|windows)\b",
        text,
    ):
        return "laptop"

    # Laptop accessories
    if re.search(
        r"\b(laptop\s*battery|laptop\s*bag|laptop\s*backpack|backpack|bacpack|laptop\s*ram|so-dimm|sodimm|laptop\s*charger|laptop\s*adapter|laptop\s*sleeve|laptop\s*stand|cooling\s*pad)\b",
        text,
    ):
        return "laptop_accessory"

    # Mobile accessories
    if re.search(
        r"\b(phone\s*holder|mobile\s*holder|phone\s*stand|mobile\s*stand|phone\s*case|mobile\s*case|phone\s*cover|mobile\s*cover|charger|charging|cable|power\s*bank|magnetic\s*holder|headset\s*stand)\b",
        text,
    ):
        return "phone_accessory"

    if re.search(
        r"\b(hand\s*bag|handbag|purse|crossbody|tote|shoulder\s*bag|clutch|wallet)\b",
        text,
    ):
        return "handbag"

    if re.search(r"\b(book|books|copybook|reading|novel|magazine)\b", text):
        return "book"

    if re.search(
        r"\b(toy|toys|diecast|model\s*car|car\s*model|pull\s*back|remote\s*control|rc\s*car)\b",
        text,
    ):
        return "toy"

    if re.search(r"\b(smart\s*watch|smartwatch|wrist\s*watch|titan\s*pro)\b", text):
        return "smartwatch"

    if re.search(
        r"\b(headphone|headphones|headset|earbud|earbuds|earphone|earphones|airpods|earpods|tws|bluetooth\s*speaker|speaker)\b",
        text,
    ):
        return "audio"

    if re.search(
        r"\b(mobile\s*phone|smartphone|iphone|samsung|vivo|oppo|infinix|tecno|redmi|realme|xiaomi|nokia|itel|pta\s*approved|dual\s*sim|android\s*smartphone)\b",
        text,
    ):
        return "mobile_phone"

    if re.search(
        r"\b(shirt|dress|jeans|shoe|shoes|sneaker|sneakers|clothing)\b",
        text,
    ):
        return "fashion_clothing"

    if re.search(
        r"\b(makeup|face\s*wash|perfume|skincare|skin\s*care|lipstick|serum)\b",
        text,
    ):
        return "beauty"

    if re.search(
        r"\b(cricket|football|tennis|fitness|gym|racket|racquet)\b",
        text,
    ):
        return "sports"

    if re.search(
        r"\b(sofa|bed|dining|furniture|decor|home\s*decor)\b",
        text,
    ):
        return "home_living"

    if query_type in {"book", "toy", "handbag", "beauty", "sports", "home_living"}:
        return query_type

    return "unknown"

def build_product_terms(product: dict[str, Any], query: str, category: str) -> str:
    values = [
        product.get("title"),
        category,
        product.get("source"),
        product.get("price"),
        product.get("discount"),
        query,
    ]

    terms = normalize_text_for_matching(" ".join(clean_text(value) for value in values))
    return terms[:2000]


class ProductDatabase:
    def __init__(self) -> None:
        missing = [name for name, value in DB_CONFIG.items() if value in (None, "")]
        if missing:
            raise RuntimeError(
                "Missing database environment variables: " + ", ".join(missing)
            )
        self.conn = psycopg2.connect(**DB_CONFIG)
        self.conn.autocommit = False

    def ensure_schema(self) -> None:
        with self.conn.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS products (
                    id BIGSERIAL PRIMARY KEY,
                    title TEXT NOT NULL,
                    price TEXT NOT NULL DEFAULT '',
                    link TEXT,
                    category TEXT NOT NULL DEFAULT 'Uncategorized',
                    reviews INTEGER NOT NULL DEFAULT 0,
                    image TEXT NOT NULL DEFAULT ''
                );
                """
            )

            cursor.execute(
                """
                ALTER TABLE products
                    ADD COLUMN IF NOT EXISTS source VARCHAR(100) NOT NULL DEFAULT 'Daraz.pk',
                    ADD COLUMN IF NOT EXISTS discount TEXT NOT NULL DEFAULT '',
                    ADD COLUMN IF NOT EXISTS review_text TEXT NOT NULL DEFAULT '',
                    ADD COLUMN IF NOT EXISTS search_query TEXT NOT NULL DEFAULT '',
                    ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'unknown',
                    ADD COLUMN IF NOT EXISTS product_terms TEXT NOT NULL DEFAULT '',
                    ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
                """
            )

            cursor.execute(
                """
                DELETE FROM products a
                USING products b
                WHERE a.id < b.id
                  AND a.link IS NOT NULL
                  AND a.link <> ''
                  AND a.link = b.link;
                """
            )

            cursor.execute(
                """
                CREATE UNIQUE INDEX IF NOT EXISTS products_link_unique
                ON products (link);
                """
            )

            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS product_analyses (
                    id BIGSERIAL PRIMARY KEY,
                    search_query TEXT NOT NULL,
                    category TEXT NOT NULL DEFAULT '',
                    analysis TEXT NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                """
            )

        self.conn.commit()

    def backfill_product_metadata(self) -> None:
        with self.conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, title, category, search_query, source, price, discount
                FROM products
                """
            )
            rows = cursor.fetchall()

            for row in rows:
                product_id, title, category, search_query, source, price, discount = row

                product = {
                    "title": title,
                    "source": source,
                    "price": price,
                    "discount": discount,
                }

                product_type = infer_product_type(
                    title=clean_text(title),
                    query=clean_text(search_query),
                    category=clean_text(category),
                )
                product_terms = build_product_terms(
                    product,
                    clean_text(search_query),
                    clean_text(category),
                )

                cursor.execute(
                    """
                    UPDATE products
                    SET product_type = %s,
                        product_terms = %s
                    WHERE id = %s
                    """,
                    (product_type, product_terms, product_id),
                )

        self.conn.commit()

    def reset_products(self) -> None:
        with self.conn.cursor() as cursor:
            cursor.execute("TRUNCATE TABLE product_analyses RESTART IDENTITY CASCADE;")
            cursor.execute("TRUNCATE TABLE products RESTART IDENTITY CASCADE;")
        self.conn.commit()

    def save_products(
        self,
        products: list[dict[str, Any]],
        category: str,
        search_query: str,
    ) -> int:
        saved = 0

        with self.conn.cursor() as cursor:
            for item in products:
                title = clean_text(item.get("title"))
                link = clean_text(item.get("link")) or None

                if not title or not link:
                    continue

                reviews = item.get("review_count", 0)
                try:
                    reviews = int(reviews or 0)
                except (TypeError, ValueError):
                    reviews = 0

                item_for_terms = {
                    **item,
                    "title": title,
                    "price": clean_text(item.get("price")),
                    "source": clean_text(item.get("source"), "Unknown"),
                    "discount": clean_text(item.get("discount")),
                }
                product_type = infer_product_type(
                    title=title,
                    query=search_query,
                    category=category,
                )
                product_terms = build_product_terms(item_for_terms, search_query, category)

                cursor.execute(
                    """
                    INSERT INTO products (
                        title,
                        price,
                        link,
                        category,
                        reviews,
                        image,
                        source,
                        discount,
                        review_text,
                        search_query,
                        product_type,
                        product_terms,
                        scraped_at
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                    ON CONFLICT (link)
                    DO UPDATE SET
                        title = EXCLUDED.title,
                        price = EXCLUDED.price,
                        category = EXCLUDED.category,
                        reviews = EXCLUDED.reviews,
                        image = EXCLUDED.image,
                        source = EXCLUDED.source,
                        discount = EXCLUDED.discount,
                        review_text = EXCLUDED.review_text,
                        search_query = EXCLUDED.search_query,
                        product_type = EXCLUDED.product_type,
                        product_terms = EXCLUDED.product_terms,
                        scraped_at = NOW()
                    """,
                    (
                        title,
                        item_for_terms["price"],
                        link,
                        category,
                        reviews,
                        clean_text(item.get("image")),
                        item_for_terms["source"],
                        item_for_terms["discount"],
                        clean_text(item.get("review_text")),
                        search_query,
                        product_type,
                        product_terms,
                    ),
                )
                saved += 1

        self.conn.commit()
        return saved

    def save_analysis(self, query: str, category: str, analysis: str) -> None:
        with self.conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO product_analyses (search_query, category, analysis)
                VALUES (%s, %s, %s)
                """,
                (query, category, analysis),
            )
        self.conn.commit()

    def close(self) -> None:
        self.conn.close()


async def make_page(browser: Browser) -> Page:
    page = await browser.new_page(
        viewport={"width": 1440, "height": 1000},
        user_agent=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/126.0.0.0 Safari/537.36"
        ),
    )
    page.set_default_timeout(30000)
    return page


async def scroll_page(page: Page, rounds: int = 4, distance: int = 1800) -> None:
    for _ in range(rounds):
        await page.mouse.wheel(0, distance)
        await asyncio.sleep(0.65)


async def scrape_techhunk_reviews(
    browser: Browser,
    link: str,
    max_reviews: int = 5,
) -> list[str]:
    if not link:
        return []

    page = await make_page(browser)
    reviews: list[str] = []

    try:
        await page.goto(link, timeout=60000, wait_until="domcontentloaded")
        await scroll_page(page, rounds=3, distance=2600)

        try:
            review_tab = await page.query_selector(
                'a:has-text("Reviews"), button:has-text("Reviews")'
            )
            if review_tab:
                await review_tab.click()
                await asyncio.sleep(1.5)
        except Exception:
            pass

        selectors = [
            ".jm-review-content",
            ".review-content",
            ".spr-review-content",
            ".review-text",
        ]

        for selector in selectors:
            elements = await page.query_selector_all(selector)
            if not elements:
                continue

            for element in elements[:max_reviews]:
                text = clean_text(await element.inner_text())
                if text:
                    reviews.append(text)
            break

    except Exception as error:
        emit("site_warning", source="TechHunk.pk", message=str(error), link=link)
    finally:
        await page.close()

    return reviews


async def scrape_techhunk(
    browser: Browser,
    query: str,
    max_pages: int,
    max_products: int,
) -> list[dict[str, Any]]:
    source = "TechHunk.pk"
    base_url = "https://techhunk.pk"
    page = await make_page(browser)
    products: list[dict[str, Any]] = []

    emit("site_started", source=source, query=query)

    try:
        await page.goto(base_url, timeout=60000, wait_until="domcontentloaded")
        await page.click(".icon-search")
        await page.wait_for_selector('input[name="q"]')
        await page.fill('input[name="q"]', query)
        await page.press('input[name="q"]', "Enter")
        await page.wait_for_selector("article.xc-card")

        for page_number in range(1, max_pages + 1):
            cards = await page.query_selector_all("article.xc-card")
            emit(
                "site_page",
                source=source,
                page=page_number,
                cards=len(cards),
            )

            for card in cards:
                if len(products) >= max_products:
                    break

                try:
                    title_el = await card.query_selector(".xc-title")
                    price_el = await card.query_selector(".xc-price")
                    discount_el = await card.query_selector(".xc-compare")
                    image_el = await card.query_selector("img.xc-img")
                    link_el = await card.query_selector("a.xc-media")

                    title = clean_text(await title_el.inner_text()) if title_el else ""
                    price = clean_text(await price_el.inner_text()) if price_el else ""
                    discount = (
                        clean_text(await discount_el.inner_text())
                        if discount_el
                        else ""
                    )

                    image = ""
                    if image_el:
                        image = normalize_url(
                            base_url,
                            await image_el.get_attribute("data-src")
                            or await image_el.get_attribute("src"),
                        )

                    link = ""
                    if link_el:
                        link = normalize_url(
                            base_url,
                            await link_el.get_attribute("href"),
                        )

                    if not title or not link:
                        continue

                    review_list = await scrape_techhunk_reviews(browser, link)

                    products.append(
                        {
                            "source": source,
                            "title": title,
                            "price": price,
                            "discount": discount,
                            "image": image,
                            "link": link,
                            "review_count": len(review_list),
                            "review_text": " | ".join(review_list),
                        }
                    )
                except Exception as error:
                    emit(
                        "product_warning",
                        source=source,
                        message=str(error),
                    )

            if len(products) >= max_products or page_number >= max_pages:
                break

            next_button = await page.query_selector('a[aria-label="Next page"]')
            if not next_button:
                break

            await next_button.click()
            await page.wait_for_selector("article.xc-card")
            await asyncio.sleep(1)

    except Exception as error:
        emit("site_error", source=source, message=str(error))
    finally:
        await page.close()

    products = unique_products(products)[:max_products]
    emit("site_completed", source=source, products=len(products))
    return products


async def scrape_daraz_reviews(
    page: Page,
    product_url: str,
    max_reviews: int = 10,
) -> list[str]:
    try:
        await page.goto(product_url, wait_until="domcontentloaded", timeout=60000)
        await scroll_page(page, rounds=4, distance=2000)

        try:
            await page.wait_for_selector(".mod-reviews", timeout=8000)
        except Exception:
            return []

        reviews: list[str] = []
        items = await page.query_selector_all(".mod-reviews .item")

        for item in items[:max_reviews]:
            content = await item.query_selector(".item-content")
            if not content:
                continue

            text = clean_text(await content.inner_text())
            if len(text) > 3:
                reviews.append(text)

        return reviews
    except Exception as error:
        emit(
            "site_warning",
            source="Daraz.pk",
            message=str(error),
            link=product_url,
        )
        return []


async def scrape_daraz(
    browser: Browser,
    query: str,
    max_pages: int,
    max_products: int,
) -> list[dict[str, Any]]:
    source = "Daraz.pk"
    listing_page = await make_page(browser)
    detail_page = await make_page(browser)
    products: list[dict[str, Any]] = []

    emit("site_started", source=source, query=query)

    try:
        for page_number in range(1, max_pages + 1):
            url = (
                "https://www.daraz.pk/catalog/"
                f"?q={quote_plus(query)}&page={page_number}"
            )
            await listing_page.goto(
                url,
                wait_until="domcontentloaded",
                timeout=60000,
            )
            await listing_page.wait_for_selector(
                '[data-qa-locator="product-item"], .Bm3ON',
                timeout=25000,
            )
            await scroll_page(listing_page, rounds=5, distance=1800)

            cards = await listing_page.query_selector_all(
                '[data-qa-locator="product-item"]'
            )
            if not cards:
                cards = await listing_page.query_selector_all(".Bm3ON")

            emit(
                "site_page",
                source=source,
                page=page_number,
                cards=len(cards),
            )

            for card in cards:
                if len(products) >= max_products:
                    break

                try:
                    title_el = (
                        await card.query_selector('[data-qa-locator="product-title"]')
                        or await card.query_selector(".RfADt")
                        or await card.query_selector("a[title]")
                    )
                    title = ""
                    if title_el:
                        title = clean_text(
                            await title_el.get_attribute("title")
                            or await title_el.inner_text()
                        )

                    price_el = (
                        await card.query_selector('[data-qa-locator="product-price"]')
                        or await card.query_selector(".aBrP0")
                    )
                    price = clean_text(await price_el.inner_text()) if price_el else ""

                    old_price_el = (
                        await card.query_selector(".WNoq3 del")
                        or await card.query_selector(".WNoq3")
                        or await card.query_selector(".IjGfG")
                    )
                    discount = (
                        clean_text(await old_price_el.inner_text())
                        if old_price_el
                        else ""
                    )

                    image_el = await card.query_selector("img")
                    image = ""
                    if image_el:
                        image = normalize_url(
                            "https://www.daraz.pk",
                            await image_el.get_attribute("data-src")
                            or await image_el.get_attribute("src"),
                        )

                    link_el = (
                        await card.query_selector(
                            'a[href*="/products/"][href*=".html"]'
                        )
                        or await card.query_selector(
                            'a[href*="-i"][href*=".html"]'
                        )
                    )

                    link = ""
                    if link_el:
                        href = await link_el.get_attribute("href")
                        link = normalize_url(
                            "https://www.daraz.pk",
                            href,
                        )

                    if not link or ".html" not in link:
                        continue

                    listing_review_count = 0
                    review_count_el = await card.query_selector(".qzqFw")
                    if review_count_el:
                        match = re.search(
                            r"\d+",
                            clean_text(await review_count_el.inner_text()).replace(",", ""),
                        )
                        if match:
                            listing_review_count = int(match.group())

                    if not title or not link:
                        continue

                    review_list = await scrape_daraz_reviews(detail_page, link)

                    products.append(
                        {
                            "source": source,
                            "title": title,
                            "price": price,
                            "discount": discount,
                            "image": image,
                            "link": link,
                            "review_count": max(listing_review_count, len(review_list)),
                            "review_text": " || ".join(review_list),
                        }
                    )
                except Exception as error:
                    emit(
                        "product_warning",
                        source=source,
                        message=str(error),
                    )

            if len(products) >= max_products:
                break

    except Exception as error:
        emit("site_error", source=source, message=str(error))
    finally:
        await listing_page.close()
        await detail_page.close()

    products = unique_products(products)[:max_products]
    emit("site_completed", source=source, products=len(products))
    return products


async def scrape_shophive(
    browser: Browser,
    query: str,
    max_pages: int,
    max_products: int,
) -> list[dict[str, Any]]:
    source = "ShopHive.com"
    base_url = "https://www.shophive.com"
    page = await make_page(browser)
    products: list[dict[str, Any]] = []

    emit("site_started", source=source, query=query)

    try:
        first_url = f"{base_url}/catalogsearch/result/?q={quote_plus(query)}"
        await page.goto(first_url, wait_until="domcontentloaded", timeout=60000)
        await page.wait_for_selector(".item.product.product-item", timeout=30000)

        for page_number in range(1, max_pages + 1):
            cards = await page.query_selector_all(".item.product.product-item")
            emit(
                "site_page",
                source=source,
                page=page_number,
                cards=len(cards),
            )

            for card in cards:
                if len(products) >= max_products:
                    break

                try:
                    title_el = await card.query_selector(
                        ".product.name.product-item-name"
                    )
                    price_el = (
                        await card.query_selector(
                            '.price-wrapper[data-price-type="finalPrice"]'
                        )
                        or await card.query_selector(".price-wrapper")
                    )
                    old_price_el = await card.query_selector(
                        '.price-wrapper[data-price-type="oldPrice"]'
                    )
                    image_el = await card.query_selector("img.product-image-photo")
                    link_el = await card.query_selector("a.product-item-link")

                    title = clean_text(await title_el.inner_text()) if title_el else ""

                    price = ""
                    if price_el:
                        price = clean_text(
                            await price_el.get_attribute("data-price-amount")
                            or await price_el.inner_text()
                        )
                        if price and not re.search(r"[A-Za-z]", price):
                            price = f"Rs. {price}"

                    discount = ""
                    if old_price_el:
                        discount = clean_text(
                            await old_price_el.get_attribute("data-price-amount")
                            or await old_price_el.inner_text()
                        )

                    image = ""
                    if image_el:
                        image = normalize_url(
                            base_url,
                            await image_el.get_attribute("data-src")
                            or await image_el.get_attribute("src"),
                        )

                    link = ""
                    if link_el:
                        link = normalize_url(
                            base_url,
                            await link_el.get_attribute("href"),
                        )

                    if not title or not link:
                        continue

                    products.append(
                        {
                            "source": source,
                            "title": title,
                            "price": price,
                            "discount": discount,
                            "image": image,
                            "link": link,
                            "review_count": 0,
                            "review_text": "",
                        }
                    )
                except Exception as error:
                    emit(
                        "product_warning",
                        source=source,
                        message=str(error),
                    )

            if len(products) >= max_products or page_number >= max_pages:
                break

            next_button = await page.query_selector("a.next.i-next")
            if not next_button:
                break

            await next_button.click()
            await page.wait_for_selector(".item.product.product-item")
            await asyncio.sleep(1)

    except Exception as error:
        emit("site_error", source=source, message=str(error))
    finally:
        await page.close()

    products = unique_products(products)[:max_products]
    emit("site_completed", source=source, products=len(products))
    return products


def analyze_products(
    query: str,
    category: str,
    products: list[dict[str, Any]],
) -> str | None:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        emit(
            "analysis_skipped",
            message="GROQ_API_KEY is not configured",
            query=query,
        )
        return None

    ranked = sorted(
        products,
        key=lambda item: (
            int(item.get("review_count") or 0),
            -(numeric_price(clean_text(item.get("price"))) or 10**12),
        ),
        reverse=True,
    )[:60]

    compact_products = [
        {
            "source": item.get("source"),
            "title": item.get("title"),
            "price": item.get("price"),
            "discount": item.get("discount"),
            "review_count": item.get("review_count"),
            "review_text": clean_text(item.get("review_text"))[:700],
            "product_type": infer_product_type(
                title=clean_text(item.get("title")),
                query=query,
                category=category,
            ),
            "link": item.get("link"),
        }
        for item in ranked
    ]
    prompt = f"""
You are an expert product analyst comparing products from Pakistani e-commerce websites.

Search query: {query}
Category: {category}

Select the BEST OVERALL VALUE product by considering both quality and price.

Scoring priorities:

1. Quality and reliability: 60%

* Positive customer review evidence
* Number of customer reviews
* Fewer complaints in review text
* Stronger review evidence is better

2. Price and value for money: 40%

* Compare the price with similar products
* The cheapest product is not automatically the best
* Prefer a reasonably priced product with stronger quality evidence
* Avoid selecting very cheap products with weak review evidence

Important rules:

* Only use the supplied product data.
* Do not invent specifications, ratings, warranty, seller reputation, or quality.
* Do not select a product only because it is the cheapest.
* Products with no reviews must have lower quality confidence.
* Use the exact title, price, source, and link from the supplied data.
* Explain both quality and price in the reason.
* Keep the Reason on one line.

Products:
{json.dumps(compact_products, ensure_ascii=False)}

Return exactly this format:

🏆 BEST PRODUCT
Name: [exact product title]
Price: [exact product price]
Source: [exact source]
Product Link: [exact product link]
Reason: [one clear line explaining quality evidence and price value]

📊 TOP 3 ALTERNATIVES

1. [exact title] - [exact price] - [exact source]
2. [exact title] - [exact price] - [exact source]
3. [exact title] - [exact price] - [exact source]
   """.strip()

    client = Groq(api_key=api_key)
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=900,
    )

    result = response.choices[0].message.content
    return str(result or "").strip()


async def scrape_one_query(
    browser: Browser,
    database: ProductDatabase,
    query: str,
    category: str,
    max_pages: int,
    max_products: int,
    run_analysis: bool,
) -> int:
    emit("query_started", query=query, category=category)

    products: list[dict[str, Any]] = []

    # Laptop-friendly mode:
    # Pehle code 3 websites ko ek sath run karta tha. Is se CPU/RAM zyada use hoti thi.
    # Ab scraper sites ko one-by-one run karega: TechHunk -> Daraz -> ShopHive.
    site_scrapers = [
        ("TechHunk.pk", scrape_techhunk),
        ("Daraz.pk", scrape_daraz),
        ("ShopHive.com", scrape_shophive),
    ]

    for source, scraper_func in site_scrapers:
        try:
            emit("site_queue_started", source=source, query=query)

            result = await scraper_func(
                browser,
                query,
                max_pages,
                max_products,
            )

            products.extend(result)

            emit(
                "site_queue_completed",
                source=source,
                query=query,
                products=len(result),
            )

            # Small delay so laptop/browser memory ko thora time mil jaye.
            await asyncio.sleep(2)

        except Exception as error:
            emit("site_error", source=source, message=str(error))

    products = unique_products(products)
    saved = database.save_products(products, category, query)

    analysis = None

    if run_analysis and products:
        try:
            analysis = await asyncio.to_thread(
                analyze_products,
                query,
                category,
                products,
            )

            if analysis:
                database.save_analysis(query, category, analysis)
                emit("analysis_completed", query=query, analysis=analysis)

        except Exception as error:
            emit("analysis_error", query=query, message=str(error))

    emit(
        "query_completed",
        query=query,
        category=category,
        scraped=len(products),
        saved=saved,
    )

    return saved


async def main() -> int:
    parser = argparse.ArgumentParser(description="Multi-store product scraper")
    parser.add_argument("--query", default="")
    parser.add_argument("--category", default="Search Results")
    parser.add_argument("--max-pages", type=int, default=1)
    parser.add_argument("--max-products", type=int, default=5)
    parser.add_argument("--all-categories", action="store_true")
    parser.add_argument("--reset", action="store_true")
    parser.add_argument("--skip-analysis", action="store_true")
    args = parser.parse_args()

    args.max_pages = max(1, min(args.max_pages, 3))
    args.max_products = max(1, min(args.max_products, 50))

    if not args.all_categories and not args.query.strip():
        parser.error("--query is required unless --all-categories is used")

    database = ProductDatabase()
    database.ensure_schema()

    if args.reset:
        database.reset_products()
        emit("database_reset")
    else:
        database.backfill_product_metadata()

    total_saved = 0

    try:
        async with async_playwright() as playwright:
            browser = await playwright.chromium.launch(headless=HEADLESS)

            try:
                if args.all_categories:
                    for category, queries in DEFAULT_CATEGORIES.items():
                        for query in queries:
                            total_saved += await scrape_one_query(
                                browser=browser,
                                database=database,
                                query=query,
                                category=category,
                                max_pages=args.max_pages,
                                max_products=args.max_products,
                                run_analysis=not args.skip_analysis,
                            )
                else:
                    total_saved += await scrape_one_query(
                        browser=browser,
                        database=database,
                        query=args.query.strip(),
                        category=args.category.strip() or "Search Results",
                        max_pages=args.max_pages,
                        max_products=args.max_products,
                        run_analysis=not args.skip_analysis,
                    )
            finally:
                await browser.close()

        emit("run_completed", total_saved=total_saved)
        return 0

    except KeyboardInterrupt:
        emit("run_stopped", message="Stopped by user")
        return 130
    except Exception as error:
        emit("run_error", message=str(error))
        return 1
    finally:
        database.close()


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
