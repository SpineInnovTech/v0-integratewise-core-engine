import { Router, type IRouter } from "express";
import healthRouter from "./health";
import leadsRouter from "./leads";
import clientsRouter from "./clients";
import dealsRouter from "./deals";
import aiRouter from "./ai";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

// Public: health check needs no session.
router.use(healthRouter);

// Everything below requires a signed-in Clerk session.
router.use(requireAuth);
router.use(leadsRouter);
router.use(clientsRouter);
router.use(dealsRouter);
router.use(aiRouter);

export default router;
