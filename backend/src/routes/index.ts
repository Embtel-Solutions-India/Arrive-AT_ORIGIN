import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { adminRouter } from "./admin.routes.js";
import { publicRouter } from "./public.routes.js";
import { seoController } from "../modules/seo/seo.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok" }, message: "Healthy" });
});

apiRouter.get("/sitemap.xml", asyncHandler(seoController.getSitemapXml));
apiRouter.get("/robots.txt", asyncHandler(seoController.getRobotsTxt));

apiRouter.use("/auth", authRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/public", publicRouter);
