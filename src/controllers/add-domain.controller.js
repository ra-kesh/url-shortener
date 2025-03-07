import { UrlService } from "../services/url.service.js";

export default async function addDomain(req, res) {
  const { domain } = req.body;

  if (!domain) {
    return res.status(400).json({
      error: "No domain provided",
    });
  }

  const apiKey = UrlService.extractApiKey(req.headers);

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

    if (user && user.tier !== "enterprise") {
      return res.status(403).json({
        error: "You do not have permission to add a custom domain",
      });
    }

    const existingDomain = await UrlService.findCustomDomainByDomain(domain);

    if (existingDomain) {
      return res.status(409).json({
        error: "Domain already exists",
      });
    }

    await UrlService.addDomain(domain, user.id);

    return res.status(201).json({
      message: "Domain added successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}
