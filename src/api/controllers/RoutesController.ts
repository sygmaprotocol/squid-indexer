/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type { FastifyReply, FastifyRequest } from "fastify";
import type { DataSource, FindOptionsWhere } from "typeorm";

import type { Route } from "../../model";
import { logger } from "../../utils/logger";
import { RoutesService } from "../services/dataAccess/routes.service";

export class RoutesController {
  private routesService: RoutesService;

  constructor(dataSource: DataSource) {
    this.routesService = new RoutesService(dataSource);
  }

  public async getRoutes(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const where: FindOptionsWhere<Route> = {};
      const routesResult = await this.routesService.findRoutes(where);
      await reply.status(200).send(routesResult);
    } catch (error) {
      logger.error("Error occurred when fetching transfers", error);
      await reply.status(500).send({ error: "Internal server error" });
    }
  }
}
