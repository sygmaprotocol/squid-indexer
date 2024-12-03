/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type { FastifyReply, FastifyRequest } from "fastify";
import type { DataSource } from "typeorm";

import { logger } from "../../utils/logger";
import type {
  ITransfer,
  ITransferByDomain,
  ITransferBySender,
  ITransferByTransferType,
  ITransferByTxHash,
} from "../interfaces";
import { TransfersService } from "../services/dataAccess/transfers.service";

export class TransfersController {
  private transfersService: TransfersService;

  constructor(dataSource: DataSource) {
    this.transfersService = new TransfersService(dataSource);
  }

  public async getTransfers(
    {
      query: { page, limit, status },
    }: FastifyRequest<{ Querystring: ITransfer }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const transfersResult = await this.transfersService.findTransfers(
        { status: status },
        { page, limit },
      );
      await reply.status(200).send(transfersResult);
    } catch (error) {
      logger.error("Error occurred when fetching all transfers", error);
      await reply.status(500).send({ error: "Internal server error" });
    }
  }

  public async getTransferByTxHash(
    {
      params: { txHash },
      query: { type, domainID, page, limit },
    }: FastifyRequest<{
      Params: ITransferByTxHash;
      Querystring: ITransferByDomain & ITransferByTransferType;
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const transfer = await this.transfersService.findTransfersByTxHash(
        txHash,
        type,
        domainID,
        { page, limit },
      );
      await reply.status(200).send(transfer);
    } catch (error) {
      logger.error(
        "Error occurred when fetching transfer by transaction hash",
        error,
      );
      await reply.status(500).send({ error: "Internal server error" });
    }
  }

  public async getTransfersBySender(
    {
      params: { senderAddress },
      query: { page, limit },
    }: FastifyRequest<{ Params: ITransferBySender; Querystring: ITransfer }>,
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
