import { UrlService } from "../services/url.service.js";

export default async function redirect(req, res) {
  const { code, password } = req.query;

  if (!code) {
    return res.status(400).json({
      error: "No short code provided",
    });
  }

  try {
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

    res.redirect(url.originalUrl);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}
