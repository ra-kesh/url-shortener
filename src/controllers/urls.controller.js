import { UrlService } from "../services/url.service.js";

export default async function urls(req, res) {
  try {
    const user = await UrlService.findUserWithUrlsById(req.user.id);

    return res.status(200).json({
      urls: user.urls,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}
