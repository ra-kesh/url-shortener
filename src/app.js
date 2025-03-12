import fs from "fs";
import path from "path";
import express from "express";
import { fileURLToPath } from "url";
import urlRoutes from "./routes/url.routes.js";

import "dotenv/config";
import loggingMiddleware from "./middleware/logging.middleware.js";
import rateLimitMiddleware from "./middleware/rate-limit.middleware.js";

const app = express();
app.use(express.json());

app.use(loggingMiddleware);
app.use(rateLimitMiddleware);

app.get("/", (req, res) => {
  res.send("Url Shortener Running");
});

app.use(urlRoutes);

export default app;
