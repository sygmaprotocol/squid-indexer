/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/

import type { FastifyReply } from "fastify";

import { logger } from "../../utils/logger";
import type { IncludedQueryParams } from "../interfaces";

export const getTransferQueryParams = (): IncludedQueryParams => {
  return {
    deposit: {
      txHash: true,
      blockNumber: true,
      depositData: true,
      handlerResponse: true,
      timestamp: true,
    },
    execution: {
      txHash: true,
      blockNumber: true,
      timestamp: true,
    },
  };
};

export class NotFound extends Error {
  constructor(message: string) {
    super(message);
  }
}

export function handleError(
  reply: FastifyReply,
  error: unknown,
  message: string,
): void {
  if (error instanceof NotFound) {
    void reply.status(404).send({ error: "Resource not found" });
  } else {
    logger.error(message, error);
    void reply.status(500).send({ error: "Internal server error" });
  }
}
