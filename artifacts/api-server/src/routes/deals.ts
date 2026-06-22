import { Router, type IRouter } from "express";
import { ListDealsResponse } from "@workspace/api-zod";
import * as deals from "../repositories/deals";

const router: IRouter = Router();

router.get("/deals", async (_req, res): Promise<void> => {
  const rows = await deals.findAll();
  res.json(ListDealsResponse.parse(rows));
});

export default router;
