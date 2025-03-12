import redisClient from "../config/redis.js";

export default async function rateLimitMiddleware(req, res, next) {
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
