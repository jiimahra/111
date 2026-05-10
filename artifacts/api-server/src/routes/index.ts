import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiRouter from "./ai";
import notificationsRouter from "./notifications";
import authRouter from "./auth";
import socialRouter from "./social";
import requestsRouter from "./requests";
import uploadRouter from "./upload";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiRouter);
router.use(notificationsRouter);
router.use(authRouter);
router.use(socialRouter);
router.use(requestsRouter);
router.use(uploadRouter);
router.use(adminRouter);

export default router;
