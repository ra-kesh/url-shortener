import express from "express";

import shorten from "../controllers/shorten.controller.js";
import redirect from "../controllers/redirect.controller.js";
import deleteUrl from "../controllers/delete.controller.js";
import batchShorten from "../controllers/batch-shorten.controller.js";
import update from "../controllers/update.controller.js";
import edit from "../controllers/edit.controller.js";
import urls from "../controllers/urls.controller.js";
import { health } from "../controllers/health.controller.js";
import apiValidationMiddleware from "../middleware/api-validation.middlware.js";
import enterpriseValidationMiddleware from "../middleware/enterprise.middleware.js";
import blacklistMiddleware from "../middleware/blacklist.middleware.js";

const router = express.Router();

router.post("/shorten", blacklistMiddleware, apiValidationMiddleware, shorten);
router.get("/urls", blacklistMiddleware, apiValidationMiddleware, urls);
router.delete(
  "/delete",
  blacklistMiddleware,
  apiValidationMiddleware,
  deleteUrl
);
router.put("/update", blacklistMiddleware, apiValidationMiddleware, update);
router.put(
  "/edit/:short_code",
  blacklistMiddleware,
  apiValidationMiddleware,
  edit
);
router.post(
  "/batch-shorten",
  blacklistMiddleware,
  enterpriseValidationMiddleware,
  batchShorten
);

router.get("/redirect", redirect);
router.get("/health", health);

export default router;
