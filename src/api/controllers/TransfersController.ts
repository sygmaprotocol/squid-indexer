/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type { FastifyReply, FastifyRequest } from "fastify";
import type { DataSource, FindOptionsWhere } from "typeorm";

import type { Transfer } from "../../model";
import { logger } from "../../utils/logger";
import {
  TransferType,
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
      query: { page, limit, status, txHash, type },
    }: FastifyRequest<{ Querystring: ITransfers & ITransferByTxHash }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const where: FindOptionsWhere<Transfer> = { status };
      if (txHash) {
        if (type != TransferType.Deposit && type != TransferType.Execution) {
          throw new Error(
            `Invalid type provided: must be 'deposit' or 'execution' when txHash is specified`,
          );
        }
        where[type] = { txHash };
      }
      const transfersResult = await this.transfersService.findTransfers(where, {
        page,
        limit,
      });
      await reply.status(200).send(transfersResult);
    } catch (error) {
      logger.error("Error occurred when fetching all transfers", error);
      await reply.status(500).send({ error: "Internal server error" });
    }
  }

  public async getTransfersBySender(
    {
      params: { senderAddress },
      query: { page, limit },
    }: FastifyRequest<{ Params: ITransferBySender; Querystring: ITransfers }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const transfers =
        await this.transfersService.findTransfersBySenderAddress(
          senderAddress,
          { page, limit },
        );
      await reply.status(200).send(transfers);
    } catch (error) {
      logger.error(
        "Error occurred when fetching transfers by sender address",
        error,
      );
      await reply.status(500).send({ error: "Internal server error" });
    }
  }
}
