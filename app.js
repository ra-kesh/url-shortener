import express from "express";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const app = express();
app.use(express.json());

const prisma = new PrismaClient();

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

app.delete("/delete", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: "Short code is required" });
  }

  try {
    const deletedUrl = await prisma.url.delete({
      where: {
        shortCode: code,
      },
    });

    if (!deletedUrl) {
      return res.status(404).send("Short code not found");
    }

    res.status(204).send("URL deleted successfully");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default app;
