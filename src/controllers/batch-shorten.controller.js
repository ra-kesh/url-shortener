import { UrlService } from "../services/url.service.js";

export default async function batchShorten(req, res) {
  const { urls } = req.body;

  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({
      error: "No URLs provided or empty array of URLs provided",
    });
  }

  try {
    if (req.user === undefined || req.user.tier !== "enterprise") {
      return res.status(403).json({
        error: "You do not have permission to batch shorten URLs",
      });
    }

    const userId = req.user.id;

    let results = [];

    for (const { original_url, expiry_date } of urls) {
      if (!original_url) {
        results.push({
          original_url: original_url,
          error: "No original URL provided",
        });
        continue;
      }

      try {
        // Validate URL
        try {
          const url = new URL(original_url);
          if (url.protocol !== "http:" && url.protocol !== "https:") {
            throw new Error("Invalid protocol");
          }
        } catch (urlError) {
          throw new Error("Invalid URL format");
        }
        const newUrl = await UrlService.create(
          original_url,
          userId,
          expiry_date
        );
        results.push({
          original_url: original_url,
          short_code: newUrl.shortCode,
        });
      } catch (error) {
        results.push({
          original_url: original_url,
          error: error.message,
        });
      }
    }

    const hasSuccess = results.some((result) => result.short_code);

    return res.status(hasSuccess ? 201 : 400).json({
      urls: results,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}
