import express, { urlencoded } from "express";

import shorten from "../controllers/shorten.controller.js";
import redirect from "../controllers/redirect.controller.js";
import deleteUrl from "../controllers/delete.controller.js";
import batchShorten from "../controllers/batch-shorten.controller.js";
import update from "../controllers/update.controller.js";
import urls from "../controllers/urls.controller.js";

const router = express.Router();

router.post("/shorten", shorten);
router.get("/redirect", redirect);
router.get("/urls", urls);
router.delete("/delete", deleteUrl);
router.post("/batch-shorten", batchShorten);
router.put("/update", update);

export default router;
