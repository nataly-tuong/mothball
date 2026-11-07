import { Router } from "express";
import sessionRoutes from "./auth/session.routes.js";
import registerRoutes from "./auth/register.routes.js";
import verificationRoutes from "./auth/verification.routes.js";
import passwordRoutes from "./auth/password.routes.js";

const router = Router();

router.use(sessionRoutes);
router.use(registerRoutes);
router.use(verificationRoutes);
router.use(passwordRoutes);

export default router;
