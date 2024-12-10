/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type { FastifyReply, FastifyRequest } from "fastify";
import type { DataSource, FindOptionsWhere } from "typeorm";

import type { Transfer } from "../../model";
import { logger } from "../../utils/logger";
import {
  TransferComponent,
  type ITransferBySender,
  type ITransferByTxHash,
  type ITransfers,
} from "../interfaces";
import { TransfersService } from "../services/dataAccess/transfers.service";

export class TransfersController {
  private transfersService: TransfersService;

  constructor(dataSource: DataSource) {
    this.transfersService = new TransfersService(dataSource);
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
        if (
          component != TransferComponent.Deposit &&
          component != TransferComponent.Execution
        ) {
          throw new Error(
            `Invalid type provided: must be 'deposit' or 'execution' when txHash is specified`,
          );
        }
        where[component] = { txHash };
      } else if (sender) {
        where.deposit = { accountID: sender };
      }
      const transfersResult = await this.transfersService.findTransfers(where, {
        page,
        limit,
      });
      await reply.status(200).send(transfersResult);
    } catch (error) {
      logger.error("Error occurred when fetching transfers", error);
      await reply.status(500).send({ error: "Internal server error" });
    }
  }
}
