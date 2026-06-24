import { Router, type IRouter } from "express";
import healthRouter from "./health";
import leadsRouter from "./leads";
import clientsRouter from "./clients";
import dealsRouter from "./deals";
import aiRouter from "./ai";
import emailRouter from "./email";
import connectorsRouter from "./connectors";
import spineRouter from "./spine";
import schemaRouter from "./schema";
import ingestRouter from "./ingest";
import contextRouter from "./context";

const router: IRouter = Router();

router.use(healthRouter);
router.use(leadsRouter);
router.use(clientsRouter);
router.use(dealsRouter);
router.use(aiRouter);
router.use(emailRouter);
router.use(connectorsRouter);
router.use(spineRouter);
router.use(schemaRouter);
router.use(ingestRouter);
router.use(contextRouter);

export default router;
