import { UrlService } from "../services/url.service.js";

export default async function urls(req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sortBy = req.query.sort_by || "createdAt";
  const sortOrder = req.query.sort_order || "desc";
  const offset = (page - 1) * limit;

  try {
    const urls = await UrlService.findUrlsbyUserId(
      req.user.id,
      offset,
      limit,
      sortBy,
      sortOrder
    );

    const totalUrls = await UrlService.countUrlsByUserId(req.user.id);
    const totalPages = Math.ceil(totalUrls / limit);

    return res.status(200).json({
      urls: urls,
      totalUrls: totalUrls,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}
