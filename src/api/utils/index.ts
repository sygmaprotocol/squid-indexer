/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type { IncludedQueryParams } from "../interfaces";

export const getTransferQueryParams = (): IncludedQueryParams => {
  return {
    resource: {
      type: true,
      id: true,
    },
    toDomain: {
      name: true,
      lastIndexedBlock: true,
      id: true,
    },
    fromDomain: {
      name: true,
      lastIndexedBlock: true,
      id: true,
    },
    fee: {
      id: true,
      amount: true,
      tokenAddress: true,
      tokenSymbol: true,
      decimals: true,
    },
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
    account: {
      id: true,
      addressStatus: true,
    },
  };
};

export class NotFound extends Error {
  constructor(message: string) {
    super(message);
  }
}
