import { Router } from "express";
import sessionRoutes from "./auth/session.routes.js";
import registerRoutes from "./auth/register.routes.js";
import verificationRoutes from "./auth/verification.routes.js";
import passwordRoutes from "./auth/password.routes.js";
import googleRoutes from "./auth/google.routes.js";
import accountRoutes from "./auth/account.routes.js";

const router = Router();

router.use(sessionRoutes);
router.use(registerRoutes);
router.use(verificationRoutes);
router.use(passwordRoutes);
router.use(googleRoutes);
router.use(accountRoutes);

export default router;
