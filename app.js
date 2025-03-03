import express from "express";
import sqlite3 from "sqlite3";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const app = express();
app.use(express.json());

const prisma = new PrismaClient();

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

app.post("/shorten", async (req, res) => {
  const { original_url } = req.body;

  if (!original_url) {
    return res.status(400).json({ error: "Original URL is required" });
  }

  const short_code = generateShortCode();

  try {
    const existingUrl = await prisma.url.findUnique({
      where: {
        originalUrl: original_url,
      },
    });

    if (existingUrl) {
      return res.status(200).json({ short_code: existingUrl.shortCode });
    }

    await prisma.url.create({
      data: {
        originalUrl: original_url,
        shortCode: short_code,
      },
    });

    res.status(201).json({ short_code });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/redirect", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: "Short code is required" });
  }

  try {
    const url = await prisma.url.findUnique({
      where: {
        shortCode: code,
      },
    });

    if (!url) {
      return res.status(404).send("Short URL not found");
    }

    res.redirect(url.originalUrl);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default app;
