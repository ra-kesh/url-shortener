import express from "express";
import { UrlController } from "../controllers/url.controller.js";

const router = express.Router();

router.post("/shorten", UrlController.shorten);
router.get("/redirect", UrlController.redirect);
router.delete("/delete", UrlController.delete);

export default router;
