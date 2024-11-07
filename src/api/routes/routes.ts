/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type { FastifyInstance } from "fastify";

import { TransfersController } from "../controllers/TransfersController";
import {
  transferByTxHashAndDomainSchema,
  transfersBySenderSchema,
  transfersSchema,
} from "../controllers/schemas";

export function transferRoutes(server: FastifyInstance): void {
  const transfersController = new TransfersController(server.db);

  server.get(
    "/transfers",
    { schema: transfersSchema },
    transfersController.getTransfers.bind(transfersController),
  );
  server.get(
    "/transfers/sender/:senderAddress",
    { schema: transfersBySenderSchema },
    transfersController.getTransfersBySender.bind(transfersController),
  );
  server.get(
    "/transfers/txHash/:txHash",
    { schema: transferByTxHashAndDomainSchema },
    transfersController.getTransferByTxHash.bind(transfersController),
  );
}
