import { UrlService } from "../services/url.service.js";

import redisClient from "../config/redis.js";

export default async function redirect(req, res) {
  const { code, password } = req.query;

  if (!code) {
    return res.status(400).json({
      error: "No short code provided",
    });
  }

  try {
    const cachedUrl = await redisClient.get(code);

    if (cachedUrl) {
      await UrlService.updateClickCount(code);
      console.log("Cache hit");
      return res.redirect(cachedUrl);
    }

    // Only query the database if not in cache
    const url = await UrlService.findByShortCode(code);

    if (!url || url.deletedAt) {
      return res.status(404).send("No original URL found");
    }

    if (url.password) {
      if (!password) {
        return res.status(401).send("Password required");
      }

      if (password !== url.password) {
        return res.status(403).send("Invalid password");
      }
    }

    if (url.expiresAt && url.expiresAt < new Date()) {
      return res.status(410).send("URL has expired");
    }

    await UrlService.updateClickCount(code);

    await redisClient.set(code, url.originalUrl);

    res.setHeader("Cache-Control", "public, max-age=604800");

    return res.redirect(url.originalUrl);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}
