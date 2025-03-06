import { UrlService } from "../services/url.service.js";

export default async function urls(req, res) {
  const apiKey = await UrlService.extractApiKey(req.headers);

  if (!apiKey) {
    return res.status(401).json({
      error: "No API key provided",
    });
  }

  try {
    const user = await UrlService.findUserWithUrlsByApiKey(apiKey);
    if (!user) {
      return res.status(401).json({
        error: "Invalid API key",
      });
    }
    return res.status(200).json({
      urls: user.urls,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}
