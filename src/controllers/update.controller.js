import { UrlService } from "../services/url.service.js";

export default async function update(req, res) {
  const {
    short_code,
    original_url,
    expiry_date,
    custom_code,
    undelete,
    password,
  } = req.body;

  if (!short_code) {
    return res.status(400).json({
      error: "No short code provided",
    });
  }

  if (!original_url && !expiry_date && !custom_code && !undelete && !password) {
    return res.status(400).json({
      error: "No update provided",
    });
  }

  try {
    const url = await UrlService.findByShortCode(short_code);

    if (!url) {
      return res.status(404).send("No original URL found");
    }

    if (req.user === undefined || req.user.id !== url.userId) {
      return res.status(403).json({
        error: "You do not have permission to update this URL",
      });
    }

    const updateData = {};

    if (original_url) {
      updateData.originalUrl = original_url;
    }

    if (expiry_date) {
      updateData.expiresAt = new Date(expiry_date);
    }
    if (custom_code) {
      const isCustomCodeTaken = await UrlService.findByShortCode(custom_code);
      if (isCustomCodeTaken) {
        throw new Error("Custom code is already taken");
      }
      updateData.shortCode = custom_code;
    }
    if (undelete) {
      updateData.deletedAt = null;
    }
    if (password) {
      updateData.password = password;
    }
    await UrlService.update(short_code, updateData);

    return res.status(200).json({
      message: "URL updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}
