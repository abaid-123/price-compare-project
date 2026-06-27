const express = require("express");
const pool = require("../db");

const router = express.Router();

/* GET WEBSITE SETTINGS */
router.get("/website", async (req, res) => {
  try {
    let result = await pool.query(
      `SELECT 
        id,
        website_name AS "websiteName",
        tagline,
        contact_email AS "contactEmail",
        logo_url AS "logoUrl",
        favicon_url AS "faviconUrl",
        primary_color AS "primaryColor"
       FROM website_settings
       ORDER BY id ASC
       LIMIT 1`
    );

    if (result.rows.length === 0) {
      const insertResult = await pool.query(
        `INSERT INTO website_settings
        (website_name, tagline, contact_email, logo_url, favicon_url, primary_color)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING 
          id,
          website_name AS "websiteName",
          tagline,
          contact_email AS "contactEmail",
          logo_url AS "logoUrl",
          favicon_url AS "faviconUrl",
          primary_color AS "primaryColor"`,
        [
          "PriceCompare AI",
          "Compare prices smartly and save money instantly.",
          "support@pricecompareai.com",
          "",
          "/favicon.svg",
          "#2563eb",
        ]
      );

      return res.json(insertResult.rows[0]);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get website settings error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/* UPDATE WEBSITE SETTINGS */
router.put("/website", async (req, res) => {
  try {
    const {
      websiteName,
      tagline,
      contactEmail,
      logoUrl,
      faviconUrl,
      primaryColor,
    } = req.body;

    if (!websiteName || websiteName.trim() === "") {
      return res.status(400).json({
        message: "Website name is required",
      });
    }

    const check = await pool.query(
      `SELECT id FROM website_settings ORDER BY id ASC LIMIT 1`
    );

    if (check.rows.length === 0) {
      const insertResult = await pool.query(
        `INSERT INTO website_settings
        (website_name, tagline, contact_email, logo_url, favicon_url, primary_color)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING 
          id,
          website_name AS "websiteName",
          tagline,
          contact_email AS "contactEmail",
          logo_url AS "logoUrl",
          favicon_url AS "faviconUrl",
          primary_color AS "primaryColor"`,
        [
          websiteName,
          tagline,
          contactEmail,
          logoUrl,
          faviconUrl,
          primaryColor,
        ]
      );

      return res.json({
        message: "Website settings saved successfully",
        settings: insertResult.rows[0],
      });
    }

    const result = await pool.query(
      `UPDATE website_settings
       SET 
        website_name = $1,
        tagline = $2,
        contact_email = $3,
        logo_url = $4,
        favicon_url = $5,
        primary_color = $6,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING 
        id,
        website_name AS "websiteName",
        tagline,
        contact_email AS "contactEmail",
        logo_url AS "logoUrl",
        favicon_url AS "faviconUrl",
        primary_color AS "primaryColor"`,
      [
        websiteName,
        tagline,
        contactEmail,
        logoUrl,
        faviconUrl,
        primaryColor,
        check.rows[0].id,
      ]
    );

    res.json({
      message: "Website settings saved successfully",
      settings: result.rows[0],
    });
  } catch (error) {
    console.error("Update website settings error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;