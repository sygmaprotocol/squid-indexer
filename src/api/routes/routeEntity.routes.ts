/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type { FastifyInstance } from "fastify";

import { RoutesController } from "../controllers/RoutesController";
import { routesSchema } from "../schemas/routes.schema";

export async function routeEntityRoutes(
  server: FastifyInstance,
): Promise<void> {
  const routesController = new RoutesController(server.db);
  server.get(
    "/routes",
    { schema: routesSchema },
    routesController.getRoutes.bind(routesController),
  );
  return Promise.resolve();
}
