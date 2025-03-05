import express from "express";

import shorten from "../controllers/shorten.controller.js";
import redirect from "../controllers/redirect.controller.js";
import deleteUrl from "../controllers/delete.controller.js";

const router = express.Router();

router.post("/shorten", shorten);
router.get("/redirect", redirect);
router.delete("/delete", deleteUrl);

export default router;
