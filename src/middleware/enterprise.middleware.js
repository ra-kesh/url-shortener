import { UrlService } from "../services/url.service.js";

export default async function enterpriseValidationMiddleware(req, res, next) {
  const apiKey = await UrlService.extractApiKey(req.headers);

  if (!apiKey) {
    return res.status(401).json({
      error: "No API key provided",
    });
  }

  try {
    const user = await UrlService.findUserByApiKey(apiKey);
    if (!user) {
      return res.status(401).json({
        error: "Invalid API key",
      });
    }

    if (user.tier !== "enterprise") {
      return res.status(403).json({
        error: "You do not have permission to access this route",
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
