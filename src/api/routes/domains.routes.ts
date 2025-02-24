/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type { FastifyInstance } from "fastify";

import { DomainsController } from "../controllers/DomainsController";
import { domainsSchema } from "../schemas/domains.schema";

export async function domainRoutes(server: FastifyInstance): Promise<void> {
  const domainsController = new DomainsController(server.db);
  server.get(
    "/domains",
    { schema: domainsSchema },
    domainsController.getDomains.bind(domainsController),
  );
  return Promise.resolve();
}
