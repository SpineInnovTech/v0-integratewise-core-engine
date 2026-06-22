import { Router, type IRouter } from "express";
import { ListClientsResponse } from "@workspace/api-zod";
import * as clients from "../repositories/clients";

const router: IRouter = Router();

router.get("/clients", async (_req, res): Promise<void> => {
  const rows = await clients.findAll();
  res.json(ListClientsResponse.parse(rows));
});

export default router;
