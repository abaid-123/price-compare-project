const express = require("express");
const pool = require("../db");
const { auth } = require("../middleware/auth");

const router = express.Router();

// ================= GET PROFILE =================
router.get("/profile", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, role
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;