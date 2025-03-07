import fs from "fs";
import path from "path";
import express from "express";
import { fileURLToPath } from "url";
import urlRoutes from "./routes/url.routes.js";

import "dotenv/config";

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use((req, res, next) => {
  const timeStamp = new Date().toISOString();
  const httpMethod = req.method;
  const host = req.hostname;
  const url = req.url;
  const userAgent = req.get("User-Agent") || req.get("user-agent");
  const ipAddress = req.ip;

  const logEntry = `${timeStamp} - ${httpMethod} -${host}${url} - ${userAgent} - ${ipAddress}\n`;

  const logFilePath = path.join(__dirname, "../request.log");
  fs.appendFile(logFilePath, logEntry, (err) => {
    if (err) {
      console.error("Error writing to log file:", err);
    }
  });

  next();
});

app.get("/", (req, res) => {
  res.send("Url Shortener Running");
});

app.use(urlRoutes);

export default app;
