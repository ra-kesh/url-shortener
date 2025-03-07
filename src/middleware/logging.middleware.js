import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function loggingMiddleware(req, res, next) {
  const logRoutes = ["/shorten", "/redirect"];
  if (logRoutes.some((route) => req.url.startsWith(route))) {
    const timeStamp = new Date().toISOString();
    const httpMethod = req.method;
    const host = req.hostname;
    const url = req.url;
    const userAgent = req.get("User-Agent") || req.get("user-agent");
    const ipAddress = req.ip;

    const logEntry = `${timeStamp} - ${httpMethod} -${host}${url} - ${userAgent} - ${ipAddress}\n`;

    const logFilePath = path.join(__dirname, "../../request.log"); // Updated path
    fs.appendFile(logFilePath, logEntry, (err) => {
      if (err) {
        console.error("Error writing to log file:", err);
      }
    });
  }

  next();
}
