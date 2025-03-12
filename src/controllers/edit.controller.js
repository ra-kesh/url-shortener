import { UrlService } from "../services/url.service.js";
import redisClient from "../config/redis.js";

export default async function edit(req, res) {
  const { short_code } = req.params;

  const { new_short_code, password } = req.body;

  if (!new_short_code) {
    return res.status(400).json({
      error: "No new short code provided",
    });
  }

  try {
    const url = await UrlService.findByShortCode(short_code);

    if (!url || url.deletedAt) {
      return res.status(404).send("No original URL found");
    }

    if (req.user === undefined || req.user.id !== url.userId) {
      return res.status(403).json({
        error: "You do not have permission to update this URL",
      });
    }

    if (url.password && password !== url.password) {
      return res.status(403).json({
        error: "Invalid password",
      });
    }

    const isNewShortCodeTaken = await UrlService.findByShortCode(
      new_short_code
    );

    if (isNewShortCodeTaken) {
      throw new Error("This short code is already taken");
    }

    await UrlService.update(short_code, {
      shortCode: new_short_code,
    });

    await redisClient.del(short_code);
    await redisClient.set(new_short_code, url.originalUrl);

    return res.status(200).json({
      message: "URL updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}
