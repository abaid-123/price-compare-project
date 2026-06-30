const express = require("express");
const pool = require("../db");
const OpenAI = require("openai");

const router = express.Router();

const CATEGORY_SLUG_MAP = {
  electronics: "Electronics",
  fashion: "Fashion",
  sports: "Sports",
  beauty: "Beauty",
  automotive: "Automotive",
  gaming: "Gaming",
  books: "Books",
  "baby-kids": "Baby & Kids",
  "home-living": "Home & Living",
};

const fetchUrl = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

function getOpenRouterClient() {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is missing in .env");
  }

  return new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
  });
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSearchWordGroups(query) {
  const stopWords = new Set([
    "for",
    "and",
    "or",
    "with",
    "the",
    "a",
    "an",
    "in",
    "on",
    "of",
    "to",
    "best",
    "new",
    "latest",
  ]);

  const words = normalizeText(query)
    .split(/\s+/)
    .filter((word) => word && !stopWords.has(word));

  const synonymMap = {
    mobile: [
      "mobile",
      "phone",
      "smartphone",
      "iphone",
      "samsung",
      "vivo",
      "oppo",
      "infinix",
      "tecno",
      "redmi",
      "realme",
      "xiaomi",
      "nokia",
      "itel",
    ],
    phone: [
      "phone",
      "mobile",
      "smartphone",
      "iphone",
      "samsung",
      "vivo",
      "oppo",
      "infinix",
      "tecno",
      "redmi",
      "realme",
      "xiaomi",
      "nokia",
      "itel",
    ],
    smartphone: [
      "smartphone",
      "mobile",
      "phone",
      "iphone",
      "samsung",
      "vivo",
      "oppo",
      "infinix",
      "tecno",
      "redmi",
      "realme",
      "xiaomi",
    ],

    book: ["book", "books", "copybook", "reading"],
    books: ["books", "book", "copybook", "reading"],
    copybook: ["copybook", "book", "books"],

    child: ["child", "children", "kid", "kids"],
    children: ["children", "child", "kid", "kids"],
    kid: ["kid", "kids", "child", "children"],
    kids: ["kids", "kid", "child", "children"],

    toy: ["toy", "toys"],
    toys: ["toys", "toy"],

    laptop: ["laptop", "laptops", "notebook"],
    laptops: ["laptops", "laptop", "notebook"],
  };

  return words.map((word) => {
    const group = synonymMap[word] ? [...synonymMap[word]] : [word];

    if (word.endsWith("s") && word.length > 3) {
      group.push(word.slice(0, -1));
    }

    return [...new Set(group)];
  });
}
function inferQueryProductType(query) {
  const text = normalizeText(query);

  if (
    /\b(mobile phone|mobile|phone|smartphone|iphone|samsung|vivo|oppo|infinix|tecno|redmi|realme|xiaomi|nokia|itel)\b/.test(
      text,
    )
  ) {
    return "mobile_phone";
  }

  if (
    /\b(headphone|headphones|headset|earbud|earbuds|earphone|earphones|airpods|earpods|tws|speaker)\b/.test(
      text,
    )
  ) {
    return "audio";
  }

  if (/\b(smart watch|smartwatch|watch)\b/.test(text)) {
    return "smartwatch";
  }

  if (/\b(book|books|copybook|reading|novel)\b/.test(text)) {
    return "book";
  }

  if (/\b(toy|toys|kids toy|children toy|diecast|model car)\b/.test(text)) {
    return "toy";
  }

  if (/\b(handbag|hand bag|bag|purse|crossbody|tote|wallet)\b/.test(text)) {
    return "handbag";
  }

  if (/\b(laptop|laptops|notebook|macbook)\b/.test(text)) {
    return "laptop";
  }

  if (/\b(charger|cable|holder|cover|case|protector|stand)\b/.test(text)) {
    return "accessory";
  }

  return "";
}

async function searchProductsInDatabase(query, category = null) {
  const cleanQuery = normalizeText(query);
  const queryProductType = inferQueryProductType(query);

  if (!cleanQuery) {
    return [];
  }

  const words = cleanQuery
    .split(/\s+/)
    .filter(
      (word) =>
        word &&
        ![
          "for",
          "and",
          "or",
          "with",
          "the",
          "a",
          "an",
          "in",
          "on",
          "of",
          "to",
          "best",
          "new",
          "latest",
        ].includes(word),
    );

  if (words.length === 0) {
    return [];
  }

  const values = [];
  const wordConditions = [];

  for (const word of words) {
    values.push(`%${word}%`);
    const parameter = `$${values.length}`;

    wordConditions.push(`
      (
        LOWER(title) LIKE ${parameter}
        OR LOWER(COALESCE(product_terms, '')) LIKE ${parameter}
        OR LOWER(COALESCE(category, '')) LIKE ${parameter}
      )
    `);
  }

  let categoryCondition = "";

  if (category) {
    values.push(category);
    categoryCondition = `AND category = $${values.length}`;
  }

  let productTypeCondition = "";

  if (queryProductType) {
    values.push(queryProductType);
    productTypeCondition = `AND product_type = $${values.length}`;
  }

  values.push(`%${cleanQuery}%`);
  const phraseParameter = `$${values.length}`;

  const result = await pool.query(
    `
      SELECT
        id,
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
        scraped_at,

        (
          CASE
            WHEN LOWER(title) LIKE ${phraseParameter} THEN 100
            ELSE 0
          END
          +
          CASE
            WHEN LOWER(COALESCE(product_terms, '')) LIKE ${phraseParameter} THEN 40
            ELSE 0
          END
          +
          CASE
            WHEN LOWER(COALESCE(category, '')) LIKE ${phraseParameter} THEN 20
            ELSE 0
          END
        ) AS relevance_score

      FROM products
      WHERE ${wordConditions.join(" AND ")}
      ${categoryCondition}
      ${productTypeCondition}

      ORDER BY
        relevance_score DESC,
        reviews DESC,
        scraped_at DESC NULLS LAST

      LIMIT 100
    `,
    values,
  );

  return result.rows;
}

function resolveCategory(value) {
  const text = String(value || "").trim();

  if (!text) {
    return null;
  }

  const normalized = text.toLowerCase();

  if (CATEGORY_SLUG_MAP[normalized]) {
    return CATEGORY_SLUG_MAP[normalized];
  }

  const exactCategory = Object.values(CATEGORY_SLUG_MAP).find(
    (category) => category.toLowerCase() === normalized,
  );

  return exactCategory || null;
}

function getNumericPrice(price) {
  const match = String(price || "")
    .replace(/,/g, "")
    .match(/\d+(?:\.\d+)?/);

  return match ? Number(match[0]) : Number.POSITIVE_INFINITY;
}

function getReviewCount(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function rankProducts(products) {
  return [...products].sort((first, second) => {
    const reviewDifference =
      getReviewCount(second.reviews) - getReviewCount(first.reviews);

    if (reviewDifference !== 0) {
      return reviewDifference;
    }

    return getNumericPrice(first.price) - getNumericPrice(second.price);
  });
}

async function findLatestAnalysis(query, category = null) {
  const values = [query];
  let categoryCondition = "";

  if (category) {
    values.push(category);
    categoryCondition = `AND category = $2`;
  }

  const result = await pool.query(
    `
      SELECT
        id,
        search_query,
        category,
        analysis,
        created_at
      FROM product_analyses
      WHERE LOWER(search_query) = LOWER($1)
      ${categoryCondition}
      ORDER BY created_at DESC
      LIMIT 1
    `,
    values,
  );

  return result.rows[0] || null;
}

function readAnalysisField(analysis, fieldName) {
  if (!analysis) {
    return "";
  }

  const expression = new RegExp(`^${fieldName}:\\s*(.+)$`, "im");
  const match = analysis.match(expression);

  return match ? match[1].trim() : "";
}

function parseGroqAnalysis(analysisText) {
  return {
    name: readAnalysisField(analysisText, "Name"),
    price: readAnalysisField(analysisText, "Price"),
    source: readAnalysisField(analysisText, "Source"),
    link: readAnalysisField(analysisText, "Product Link"),
    reason: readAnalysisField(analysisText, "Reason"),
  };
}

function normalizeLink(value) {
  let link = String(value || "").trim();

  while (link.endsWith("/")) {
    link = link.slice(0, -1);
  }

  return link;
}

function linksMatch(firstLink, secondLink) {
  const first = normalizeLink(firstLink);
  const second = normalizeLink(secondLink);

  return Boolean(first && second && first === second);
}

function findAnalysisProduct(products, parsedAnalysis) {
  if (!products.length) {
    return null;
  }

  if (parsedAnalysis.link) {
    const productByLink = products.find((product) =>
      linksMatch(product.link, parsedAnalysis.link)
    );

    if (productByLink) {
      return productByLink;
    }
  }

  const analysisTitle = normalizeText(parsedAnalysis.name);
  const analysisSource = normalizeText(parsedAnalysis.source);

  if (!analysisTitle) {
    return null;
  }

  const exactProduct = products.find((product) => {
    const productTitle = normalizeText(product.title);
    const productSource = normalizeText(product.source);

    return (
      productTitle === analysisTitle &&
      (!analysisSource || productSource === analysisSource)
    );
  });

  if (exactProduct) {
    return exactProduct;
  }

  return (
    products.find((product) => {
      const productTitle = normalizeText(product.title);
      const productSource = normalizeText(product.source);

      const titleMatches =
        productTitle.includes(analysisTitle) ||
        analysisTitle.includes(productTitle);

      const sourceMatches =
        !analysisSource || productSource === analysisSource;

      return titleMatches && sourceMatches;
    }) || null
  );
}

async function findAnalysisProductFromDatabase(parsedAnalysis) {
  if (!parsedAnalysis?.link) {
    return null;
  }

  const result = await pool.query(
    `
      SELECT
        id,
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
      FROM products
      WHERE link = $1
      LIMIT 1
    `,
    [parsedAnalysis.link]
  );

  return result.rows[0] || null;
}


function buildSearchResults(products, analysisRow) {
  const rankedProducts = rankProducts(products);
  const parsedAnalysis = parseGroqAnalysis(analysisRow?.analysis || "");

  const aiProduct = analysisRow
    ? findAnalysisProduct(rankedProducts, parsedAnalysis)
    : null;

  if (aiProduct) {
    return {
      analysisFound: true,
      recommendedProduct: {
        ...aiProduct,
        isBest: true,
        isTopMatch: false,
        recommendationType: "ai",
        aiReason: parsedAnalysis.reason || null,
      },
      results: [
        {
          ...aiProduct,
          isBest: true,
          isTopMatch: false,
          recommendationType: "ai",
          aiReason: parsedAnalysis.reason || null,
        },
        ...rankedProducts
          .filter((product) => product.id !== aiProduct.id)
          .map((product) => ({
            ...product,
            isBest: false,
            isTopMatch: false,
            recommendationType: null,
            aiReason: null,
          })),
      ],
    };
  }

  const topMatch = rankedProducts[0] || null;

  if (!topMatch) {
    return {
      analysisFound: false,
      recommendedProduct: null,
      results: [],
    };
  }

  return {
    analysisFound: false,
    recommendedProduct: {
      ...topMatch,
      isBest: false,
      isTopMatch: true,
      recommendationType: "top_match",
      aiReason: null,
    },
    results: [
      {
        ...topMatch,
        isBest: false,
        isTopMatch: true,
        recommendationType: "top_match",
        aiReason: null,
      },
      ...rankedProducts
        .filter((product) => product.id !== topMatch.id)
        .map((product) => ({
          ...product,
          isBest: false,
          isTopMatch: false,
          recommendationType: null,
          aiReason: null,
        })),
    ],
  };
}

async function createSearchResult(query, category = null) {
  let products = await searchProductsInDatabase(query, category);
  const analysisRow = await findLatestAnalysis(query, category);

  if (analysisRow) {
    const parsedAnalysis = parseGroqAnalysis(analysisRow.analysis || "");
    const dbAnalysisProduct = await findAnalysisProductFromDatabase(parsedAnalysis);

    if (
      dbAnalysisProduct &&
      !products.some((product) => product.id === dbAnalysisProduct.id)
    ) {
      products = [dbAnalysisProduct, ...products];
    }
  }

  const recommendation = buildSearchResults(products, analysisRow);
  const recommendedProduct = recommendation.recommendedProduct;

  return {
    query,
    category,
    analysisFound: recommendation.analysisFound,
    analysis: recommendation.analysisFound
      ? {
          id: analysisRow.id,
          searchQuery: analysisRow.search_query,
          category: analysisRow.category,
          text: analysisRow.analysis,
          reason: readAnalysisField(analysisRow.analysis, "Reason"),
          createdAt: analysisRow.created_at,
        }
      : null,
    bestProduct:
      recommendedProduct?.recommendationType === "ai"
        ? recommendedProduct
        : null,
    topMatch:
      recommendedProduct?.recommendationType === "top_match"
        ? recommendedProduct
        : null,
    alternatives: recommendation.results.slice(1, 4),
    results: recommendation.results,
  };
}

/* IMAGE PROXY */

router.get("/image", async (req, res) => {
  try {
    const imageUrl = String(req.query.url || "").trim();

    if (!imageUrl) {
      return res.status(400).send("No image URL provided");
    }

    const parsedUrl = new URL(imageUrl);

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return res.status(400).send("Invalid image URL");
    }

    const response = await fetchUrl(imageUrl);

    if (!response.ok) {
      return res.status(response.status).send("Image fetch failed");
    }

    const buffer = await response.arrayBuffer();

    res.set(
      "Content-Type",
      response.headers.get("content-type") || "image/jpeg",
    );

    return res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("Image fetch error:", error);
    return res.status(500).send("Image fetch failed");
  }
});

/* TOTAL PRODUCTS COUNT */

router.get("/count/all", async (req, res) => {
  try {
    const result = await pool.query("SELECT COUNT(*) FROM products");

    return res.json({
      totalProducts: Number(result.rows[0].count),
    });
  } catch (error) {
    console.error("Count error:", error);

    return res.status(500).json({
      error: "Server error",
    });
  }
});

/* OLD FRONTEND-COMPATIBLE SEARCH */

router.get("/search/all", async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    const requestedCategory = String(req.query.category || "").trim();
    const category = requestedCategory
      ? resolveCategory(requestedCategory)
      : null;

    if (!query) {
      return res.json([]);
    }

    if (requestedCategory && !category) {
      return res.status(400).json({
        error: "Invalid category",
      });
    }

    const searchResult = await createSearchResult(query, category);

    return res.json(searchResult.results);
  } catch (error) {
    console.error("Search error:", error);

    return res.status(500).json({
      error: "Server error",
    });
  }
});

/* BEST PRODUCT SEARCH */

router.get("/search/best", async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    const requestedCategory = String(req.query.category || "").trim();
    const category = requestedCategory
      ? resolveCategory(requestedCategory)
      : null;

    if (!query) {
      return res.status(400).json({
        error: "Search query is required",
      });
    }

    if (requestedCategory && !category) {
      return res.status(400).json({
        error: "Invalid category",
      });
    }

    const searchResult = await createSearchResult(query, category);

    return res.json(searchResult);
  } catch (error) {
    console.error("Best product search error:", error);

    return res.status(500).json({
      error: "Server error",
    });
  }
});

/* IMAGE SEARCH */

router.post("/image-search", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({
        error: "No image was provided.",
      });
    }

    const openrouter = getOpenRouterClient();

    const aiResult = await openrouter.chat.completions.create({
      model:
        process.env.OPENROUTER_VISION_MODEL ||
        "nvidia/nemotron-nano-12b-v2-vl:free",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType || "image/jpeg"};base64,` + imageBase64,
              },
            },
            {
              type: "text",
              text:
                "Identify the main product in this image. " +
                "Reply with only the product name someone would search " +
                "in an e-commerce store. Do not provide an explanation.",
            },
          ],
        },
      ],
      max_tokens: 100,
    });

    const rawContent = aiResult.choices[0]?.message?.content;

    if (!rawContent) {
      return res.status(500).json({
        error: "AI could not detect the product.",
      });
    }

    const productName = String(rawContent).trim();
    const searchResult = await createSearchResult(productName);

    return res.json({
      productName,
      ...searchResult,
    });
  } catch (error) {
    console.error("Image search error:", error);

    return res.status(500).json({
      error: "Image search failed",
    });
  }
});

/* FEATURED PRODUCTS */

router.get("/featured", async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          id,
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
        FROM products
        ORDER BY COALESCE(reviews, 0) DESC, scraped_at DESC NULLS LAST
        LIMIT 8
      `,
    );

    return res.json(result.rows);
  } catch (error) {
    console.error("Featured products error:", error);

    return res.status(500).json({
      error: "Server error",
    });
  }
});

/* CATEGORY PRODUCTS - ALWAYS LAST */

router.get("/:category", async (req, res) => {
  try {
    const dbCategory = resolveCategory(req.params.category);

    if (!dbCategory) {
      return res.json([]);
    }

    const result = await pool.query(
      `
        SELECT
          id,
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
        FROM products
        WHERE category = $1
        ORDER BY reviews DESC, scraped_at DESC NULLS LAST
      `,
      [dbCategory],
    );

    return res.json(result.rows);
  } catch (error) {
    console.error("Category error:", error);

    return res.status(500).json({
      error: "Server error",
    });
  }
});

module.exports = router;
