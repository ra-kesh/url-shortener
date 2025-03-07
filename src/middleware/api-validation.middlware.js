import { UrlService } from "../services/url.service.js";

export default function apiValidationMiddleware(req, res, next) {
  const apiKey = UrlService.extractApiKey(req.headers);

  if (!apiKey) {
    return res.status(401).json({
      error: "No API key provided",
    });
  }

  try {
    const user = UrlService.findUserByApiKey(apiKey);
    if (!user) {
      return res.status(401).json({
        error: "Invalid API key",
      });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}
