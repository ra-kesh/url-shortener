import { UrlService } from "../services/url.service.js";

export default async function shorten(req, res) {
  const { original_url } = req.body;

  if (!original_url) {
    return res.status(400).json({
      error: "No original URL provided",
    });
  }

  const apiKey = UrlService.extractApiKey(req.headers);

  try {
    let user = null;
    if (apiKey !== undefined) {
      user = await UrlService.findUserByApiKey(apiKey);
    }

    const userId = user ? user.id : null;
    const newUrl = await UrlService.create(original_url, userId);

    return res.status(201).json({
      short_code: newUrl.shortCode,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
}
