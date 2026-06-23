import { Router, type IRouter } from "express";
import healthRouter from "./health";
import leadsRouter from "./leads";
import clientsRouter from "./clients";
import dealsRouter from "./deals";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(leadsRouter);
router.use(clientsRouter);
router.use(dealsRouter);
router.use(aiRouter);

export default router;
