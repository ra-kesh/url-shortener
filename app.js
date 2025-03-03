import express from "express";
import sqlite3 from "sqlite3";
import crypto from "crypto";

const app = express();
app.use(express.json());

const db = new sqlite3.Database("urls.db", () => {
  db.run(`CREATE TABLE IF NOT EXISTS urls(
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        original_url TEXT NOT NULL, 
        short_code VARCHAR (10) UNIQUE NOT NULL, 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
});

function generateShortCode() {
  return crypto.randomBytes(3).toString("hex");
}

app.get("/", (req, res) => {
  res.send("Url Shortener Running");
});

app.post("/shorten", (req, res) => {
  const { original_url } = req.body;

  if (!original_url) {
    return res.status(400).json({ error: "Original URL is required" });
  }

  const short_code = generateShortCode();

  const sql = "INSERT INTO urls (short_code,original_url) VALUES(?,?)";

  db.run(sql, [short_code, original_url], function () {
    res.status(201).json({ short_code });
  });
});

app.get("/redirect", (req, res) => {
  const { code } = req.query;

  const sql = "SELECT original_url FROM urls WHERE short_code=?";

  db.get(sql, [code], (err, row) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).send("An error occurred while retrieving the URL");
    }

    if (!row) {
      return res.status(404).send("Short URL not found");
    }

    res.redirect(row.original_url);
  });
});

export default app;
