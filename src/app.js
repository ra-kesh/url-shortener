import express from "express";
import urlRoutes from "./routes/url.routes.js";

import "dotenv/config";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Url Shortener Running");
});

app.use(urlRoutes);

export default app;
