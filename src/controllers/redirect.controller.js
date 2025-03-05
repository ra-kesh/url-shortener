import { UrlService } from "../services/url.service.js";

export default async function redirect(req, res) {
  const { code } = req.query;

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

    await UrlService.updateClickCount(code);

    res.redirect(url.originalUrl);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}
