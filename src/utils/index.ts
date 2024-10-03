/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import { DataSource } from "typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

import type { IncludedQueryParams } from "../interfaces";
import {
  Account,
  Deposit,
  Domain,
  Execution,
  Fee,
  Resource,
  Transfer,
} from "../model";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || ""),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASS,
  entities: [Domain, Transfer, Resource, Deposit, Execution, Account, Fee],
  namingStrategy: new SnakeNamingStrategy(),
});

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
