import { UrlService } from "../services/url.service.js";

export async function health(req, res) {
  const healthcheck = {
    uptime: process.uptime(),
    timestamp: Date.now(),
  };

  try {
    await UrlService.checkConnection();
    return res.status(200).json({
      status: "OK",
      message: "Server and database connection is healthy",
      healthcheck,
    });
  } catch (error) {
    return res.status(500).json({
      status: "ERROR",
      message: "Database connectivity issue",
      error: error.message,
    });
  }
}
