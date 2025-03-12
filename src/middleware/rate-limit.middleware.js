import redisClient from "../config/redis.js";

const EXCLUDED_ROUTES = ["/shorten", "/redirect"];

export default async function rateLimitMiddleware(req, res, next) {
  if (EXCLUDED_ROUTES.includes(req.path)) {
    return next();
  }

  const clientIp = req.ip;

  try {
    const visitCount = await redisClient.incr(clientIp);

    if (visitCount === 1) {
      await redisClient.expire(clientIp, 60);
    }

    if (visitCount > 100) {
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
