import { UrlService } from "../services/url.service.js";

export default async function deleteUrl(req, res) {
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

    if (req.user === undefined) {
      return res.status(401).json({
        error: "No API key provided",
      });
    }

    if (url.userId === null) {
      await UrlService.delete(code);
      return res.status(204).send("URL deleted successfully");
    }

    if (url.userId === req.user.id) {
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
