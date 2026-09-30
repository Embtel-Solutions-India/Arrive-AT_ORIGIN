import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { usersRouter } from "../modules/users/users.routes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok" }, message: "Healthy" });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/users", usersRouter);

// Later phases mount here: /blog, /media, /products, /inventory, /cart, /checkout, /orders,
// /payments, /consultations, /availability, /bookings, /customers, /coupons, /analytics
