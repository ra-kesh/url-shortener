import { UrlService } from "../services/url.service.js";

export default async function deleteUrl(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({
      error: "No short code provided",
    });
  }

  let apiKey = req.headers["api-key"] || req.headers.authorization;

  if (apiKey?.startsWith("Bearer ")) {
    apiKey = apiKey.split(" ")[1];
  }

  try {
    let user = null;
    if (apiKey !== undefined) {
      user = await UrlService.findUserByApiKey(apiKey);
    }

    const url = await UrlService.findByShortCode(code);

    if (!url || url.deletedAt) {
      return res.status(404).send("No original URL found");
    }

    // If an API key was provided, it must be valid
    if (apiKey !== undefined && user === null) {
      return res.status(403).json({
        error: "You do not have permission to delete this URL",
      });
    }

    // Allow deletion if URL has no owner AND no API key was provided
    if (url.userId === null && apiKey === undefined) {
      await UrlService.delete(code);
      return res.status(204).send("URL deleted successfully");
    }

    // For URLs with an owner, require authentication and ownership match
    if (user !== null && url.userId === user.id) {
      await UrlService.delete(code);
      return res.status(204).send("URL deleted successfully");
    } else {
      return res.status(403).json({
        error: "You do not have permission to delete this URL",
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}
