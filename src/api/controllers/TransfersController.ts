/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type { FastifyReply, FastifyRequest } from "fastify";
import type { DataSource, FindOptionsWhere } from "typeorm";

import type { Deposit, Transfer } from "../../model";
import { getLogger } from "../../utils/logger";
import {
  type ITransferBySender,
  type ITransferByTxHash,
  type ITransfers,
} from "../interfaces";
import { TransfersService } from "../services/dataAccess/transfers.service";

export class TransfersController {
  private transfersService: TransfersService;
  logger;
  constructor(dataSource: DataSource) {
    this.transfersService = new TransfersService(dataSource);
    this.logger = getLogger();
  }

  public async getTransfers(
    {
      query: { page, limit, status, txHash, component, sender },
    }: FastifyRequest<{
      Querystring: ITransfers & ITransferByTxHash & ITransferBySender;
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const where: FindOptionsWhere<Transfer> = { status };
      if (txHash) {
        where[component] = { txHash };
      }

      if (sender) {
        where.deposit = { ...(where.deposit as Deposit), accountID: sender };
      }

      const transfersResult = await this.transfersService.findTransfers(where, {
        page,
        limit,
      });
      await reply.status(200).send(transfersResult);
    } catch (error) {
      this.logger.error("Error occurred when fetching transfers", error);
      await reply.status(500).send({ error: "Internal server error" });
    }
  }
}
