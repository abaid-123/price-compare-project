const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db");
const { auth, isAdmin } = require("../middleware/auth");
const {
  startDarazScraper,
  stopDarazScraper,
} = require("../controllers/scraperController");

const router = express.Router();

// create admin
router.post("/create-admin", async (req, res) => {
  try {
    const existing = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      ["admin@gmail.com"]
    );

    if (existing.rows.length > 0) {
      return res.send("Admin already exists");
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    await pool.query(
      `INSERT INTO users (full_name, email, password, role)
       VALUES ($1, $2, $3, $4)`,
      ["Admin", "admin@gmail.com", hashedPassword, "admin"]
    );

    res.send("Admin created successfully");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* =========================
   ADMIN PROFILE SETTINGS
========================= */

// get admin profile
router.get("/profile", auth, isAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;

    if (!adminId) {
      return res.status(400).json({
        message: "Admin id not found in token",
      });
    }

    const result = await pool.query(
      `SELECT id, full_name, email, role
       FROM users
       WHERE id = $1`,
      [adminId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// update admin profile
router.put("/profile", auth, isAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    const { full_name, email } = req.body;

    if (!adminId) {
      return res.status(400).json({
        message: "Admin id not found in token",
      });
    }

    if (!full_name || !email) {
      return res.status(400).json({
        message: "Full name and email are required",
      });
    }

    const result = await pool.query(
      `UPDATE users
       SET full_name = $1, email = $2
       WHERE id = $3
       RETURNING id, full_name, email, role`,
      [full_name, email, adminId]
    );

    res.json({
      message: "Profile updated successfully",
      user: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// change admin password
router.put("/profile/password", auth, isAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!adminId) {
      return res.status(400).json({
        message: "Admin id not found in token",
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters",
      });
    }

    const userResult = await pool.query(
      `SELECT id, password FROM users WHERE id = $1`,
      [adminId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const admin = userResult.rows[0];

    const isMatch = await bcrypt.compare(currentPassword, admin.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `UPDATE users
       SET password = $1
       WHERE id = $2`,
      [hashedPassword, adminId]
    );

    res.json({
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* =========================
   USERS MANAGEMENT
========================= */

// count users - KEEP THIS BEFORE /users/:id
router.get("/users/count", auth, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role != $1",
      ["admin"]
    );

    res.json({
      totalUsers: Number(result.rows[0].count),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// get all users
router.get("/users", auth, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, full_name, email, role
      FROM users
      WHERE role != 'admin'
      ORDER BY id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// update user
router.put("/users/:id", auth, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { full_name, email } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users
       SET full_name = $1, email = $2
       WHERE id = $3
       RETURNING id, full_name, email, role`,
      [full_name, email, id]
    );

    res.json({
      message: "User updated successfully",
      user: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// delete user
router.delete("/users/:id", auth, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM users WHERE id = $1", [id]);

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* =========================
   SCRAPER
========================= */  

router.post("/scraper/start", auth, isAdmin, startDarazScraper);
router.post("/scraper/stop", auth, isAdmin, stopDarazScraper);

module.exports = router;