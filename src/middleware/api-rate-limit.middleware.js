import { UrlService } from "../services/url.service.js";

import redisClient from "../config/redis.js";

const LIMITS = {
  free: {
    "/shorten": { max: 5, timeFrame: 60 },
    "/redirect": { max: 5, timeFrame: 60 },
  },
  hobby: {
    "/shorten": { max: 10, timeFrame: 1 },
    "/redirect": { max: 50, timeFrame: 1 },
  },
  enterprise: {
    "/shorten": { max: 10, timeFrame: 1 },
    "/redirect": { max: 50, timeFrame: 1 },
  },
};

export default async function apiRateLimitMiddleware(req, res, next) {
  const apiKey = await UrlService.extractApiKey(req.headers);
  const endpoint = req.path;

  if (!apiKey || !LIMITS[req.user.tier][endpoint]) {
    return next();
  }

  try {
    const visitCount = await redisClient.incr(apiKey + endpoint);

    if (visitCount === 1) {
      await redisClient.expire(
        apiKey + endpoint,
        LIMITS[req.user.tier][endpoint].timeFrame
      );
    }

    if (visitCount > LIMITS[req.user.tier][endpoint].max) {
      return res.status(429).json({
        error: "Too many requests",
      });
    }
    next();
  } catch (error) {
    console.error("Middleware error:", error);
    return res.status(500).json({
      error: "Error in rate limiting middleware",
    });
  }
}
