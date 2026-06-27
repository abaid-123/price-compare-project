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
    "Electronics": [
        "laptop",
        "mobile phone",
        "airpods",
        # "smart watch",
        # "headphones",
        # "bluetooth speaker",
    ],
    # "Fashion": ["men shirt", "women dress", "shoes", "handbag"],
    # "Sports": ["cricket bat", "football", "tennis racket"],
    # "Beauty": ["face wash", "perfume", "makeup kit"],
    # "Automotive": ["car accessories", "motorcycle helmet", "car phone holder"],
    # "Gaming": ["ps5", "xbox series x", "nintendo switch"],
    # "Books": ["novel book", "self-help book", "children book", "programming book"],
    # "Baby & Kids": ["kids toys", "baby stroller", "kids clothing"],
    # "Home & Living": ["sofa", "dining table", "bed", "home decor"],
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

    def reset_products(self) -> None:
        with self.conn.cursor() as cursor:
            cursor.execute("TRUNCATE TABLE products RESTART IDENTITY;")
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
                        scraped_at
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
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
                        scraped_at = NOW()
                    """,
                    (
                        title,
                        clean_text(item.get("price")),
                        link,
                        category,
                        reviews,
                        clean_text(item.get("image")),
                        clean_text(item.get("source"), "Unknown"),
                        clean_text(item.get("discount")),
                        clean_text(item.get("review_text")),
                        search_query,
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

    site_results = await asyncio.gather(
        scrape_techhunk(browser, query, max_pages, max_products),
        scrape_daraz(browser, query, max_pages, max_products),
        scrape_shophive(browser, query, max_pages, max_products),
        return_exceptions=True,
    )

    products: list[dict[str, Any]] = []
    site_names = ["TechHunk.pk", "Daraz.pk", "ShopHive.com"]

    for source, result in zip(site_names, site_results):
        if isinstance(result, Exception):
            emit("site_error", source=source, message=str(result))
            continue
        products.extend(result)

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
    parser.add_argument("--max-products", type=int, default=15)
    parser.add_argument("--all-categories", action="store_true")
    parser.add_argument("--reset", action="store_true")
    parser.add_argument("--skip-analysis", action="store_true")
    args = parser.parse_args()

    args.max_pages = max(1, min(args.max_pages, 5))
    args.max_products = max(1, min(args.max_products, 100))

    if not args.all_categories and not args.query.strip():
        parser.error("--query is required unless --all-categories is used")

    database = ProductDatabase()
    database.ensure_schema()

    if args.reset:
        database.reset_products()
        emit("database_reset")

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
