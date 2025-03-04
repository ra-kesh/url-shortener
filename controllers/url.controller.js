import { UrlService } from "../services/url.service.js";

export class UrlController {
  static async shorten(req, res) {
    const { original_url } = req.body;

    if (!original_url) {
      return res.status(400).json({
        error: "Original URL is required",
      });
    }

    try {
      const existingUrl = await UrlService.findByOriginaurl(original_url);

      if (existingUrl) {
        return res.status(200).json({
          short_code: existingUrl.shortCode,
        });
      }

      const newUrl = await UrlService.create(original_url);
      return res.status(200).json({
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
        error: "Short code is required",
      });
    }

    try {
      const url = await UrlService.findByshortCode(code);

      if (!url) {
        return res.status(404).send("No Original Urls could be found");
      }

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
        error: "No short code could be found",
      });
    }

    try {
      await UrlService.delete(code);
      return res.status(204).send("Url deleted successfully");
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }
  }
}
