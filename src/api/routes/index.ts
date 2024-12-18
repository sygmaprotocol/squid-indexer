/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type { FastifyInstance } from "fastify";

import { routeEntityRoutes } from "./routeEntity.routes";
import { transferRoutes } from "./transfers.routes";

export async function registerRoutes(server: FastifyInstance): Promise<void> {
  await server.register(transferRoutes, { prefix: "/api" });
  await server.register(routeEntityRoutes, { prefix: "/api" });
}
