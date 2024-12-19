/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type { FastifyReply, FastifyRequest } from "fastify";
import type { DataSource } from "typeorm";

import { logger } from "../../utils/logger";
import { DomainsService } from "../services/dataAccess/domains.service";

export class DomainsController {
  private domainsService: DomainsService;

  constructor(dataSource: DataSource) {
    this.domainsService = new DomainsService(dataSource);
  }

  public async getDomains(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const domainsResult = await this.domainsService.findDomains({});
      await reply.status(200).send(domainsResult);
    } catch (error) {
      logger.error("Error occurred when fetching domains", error);
      await reply.status(500).send({ error: "Internal server error" });
    }
  }
}
