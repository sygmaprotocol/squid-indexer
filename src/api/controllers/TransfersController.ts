/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type { FastifyReply, FastifyRequest } from "fastify";
import type { DataSource } from "typeorm";

import type {
  ITransfer,
  ITransferByDomain,
  ITransferBySender,
  ITransferByTxHash,
} from "../interfaces";
import { TransfersService } from "../services/dataAccess/transfers.service";
import { handleError } from "../services/utils";

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
      void reply.status(200).send(transfersResult);
    } catch (error) {
      handleError(reply, error, "Error occurred when fetching all transfers.");
    }
  }

  public async getTransferByTxHash(
    {
      params: { txHash },
      query: { domainID, page, limit },
    }: FastifyRequest<{
      Params: ITransferByTxHash;
      Querystring: ITransferByDomain;
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const transfer = await this.transfersService.findTransfersByTxHash(
        txHash,
        domainID,
        { page, limit },
      );
      void reply.status(200).send(transfer);
    } catch (error) {
      handleError(
        reply,
        error,
        "Error occurred when fetching transfer by transaction hash and domainID.",
      );
    }
  }

  public async getTransfersBySender(
    {
      params: { senderAddress },
      query: { page, limit, status },
    }: FastifyRequest<{ Params: ITransferBySender; Querystring: ITransfer }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const transfers =
        await this.transfersService.findTransfersBySenderAddress(
          senderAddress,
          status,
          { page, limit },
        );
      void reply.status(200).send(transfers);
    } catch (error) {
      handleError(
        reply,
        error,
        "Error occurred when fetching transfers by sender address.",
      );
    }
  }
}
