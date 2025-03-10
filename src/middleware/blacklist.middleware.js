import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { UrlService } from "../services/url.service.js";

export default async function blacklistMiddleware(req, res, next) {
  const startTime = Date.now();

  const originalSend = res.send;

  res.send = function (...args) {
    const endTime = Date.now();
    const elaspsedTime = endTime - startTime;
    console.log(`Response time: ${elaspsedTime}ms`);
    res.setHeader("X-Processing-Time", `${elaspsedTime}ms`);
    return originalSend.apply(this, args);
  };

  try {
    const apikey = await UrlService.extractApiKey(req.headers);

    if (!apikey) {
      return res.status(401).json({
        error: "No API key provided",
      });
    }

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const blacklistPath = path.join(__dirname, "../../blacklist.json");

    try {
      const data = await fs.readFile(blacklistPath, "utf-8");
      const blackList = JSON.parse(data);
      const blackListedKeys = blackList.blacklistedKeys;

      if (blackListedKeys.includes(apikey)) {
        return res.status(403).json({
          error: "Your API key is blacklisted",
        });
      }

      next();
    } catch (error) {
      if (error.code === "ENOENT") {
        // File doesn't exist, assume no blacklist
        next();
        return;
      }
      console.error("Blacklist error:", error);
      return res.status(500).json({
        error: "Error processing blacklist",
      });
    }
  } catch (error) {
    console.error("Middleware error:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
