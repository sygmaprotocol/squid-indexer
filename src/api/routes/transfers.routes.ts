/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type { FastifyInstance } from "fastify";

import { TransfersController } from "../controllers/TransfersController";
import { transfersSchema } from "../schemas/transfers.schema";

export async function transferRoutes(server: FastifyInstance): Promise<void> {
  const transfersController = new TransfersController(server.db);
  server.get(
    "/transfers",
    { schema: transfersSchema },
    transfersController.getTransfers.bind(transfersController),
  );
  return Promise.resolve();
}
