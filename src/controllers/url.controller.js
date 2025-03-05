import { UrlService } from "../services/url.service.js";

export class UrlController {
  static async shorten(req, res) {
    const { original_url } = req.body;

    if (!original_url) {
      return res.status(400).json({
        error: "No original URL provided",
      });
    }

    let apiKey =
      req.headers["api-key"] ||
      req.headers["x-api-key"] ||
      req.body.apiKey ||
      req.headers.authorization;

    if (apiKey?.startsWith("Bearer ")) {
      apiKey = apiKey.split(" ")[1];
    }

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

  static async redirect(req, res) {
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

  static async delete(req, res) {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({
        error: "No short code provided",
      });
    }

    let apiKey =
      req.headers["api-key"] ||
      req.headers["x-api-key"] ||
      req.body.apiKey ||
      req.headers.authorization;

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

      if (user && url.userId !== user.id) {
        return res.status(403).json({
          error: "You do not have permission to delete this URL",
        });
      }

      await UrlService.delete(code);
      return res.status(204).send("URL deleted successfully");
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }
  }
}
