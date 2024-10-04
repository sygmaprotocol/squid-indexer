/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import { DataSource } from "typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

import {
  Account,
  Deposit,
  Domain,
  Execution,
  Fee,
  Resource,
  Transfer,
} from "../model";

export async function initDatabase(): Promise<DataSource> {
  const dataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || ""),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASS,
    entities: [Domain, Transfer, Resource, Deposit, Execution, Account, Fee],
    namingStrategy: new SnakeNamingStrategy(),
  });
  await dataSource.initialize();
  return dataSource;
}

export function generateTransferID(
  depositNonce: string,
  fromDomainID: string,
  toDomainID: string,
): string {
  return depositNonce + "-" + fromDomainID + "-" + toDomainID;
}

export async function fetchRetry(
  input: RequestInfo | URL,
  init?: RequestInit | undefined,
  retryCount = parseInt(process.env.RETRY_COUNT || "3"),
  backoff = parseInt(process.env.BACKOFF || "500"),
): Promise<Response> {
  let statusCode = 0;
  while (retryCount > 0) {
    try {
      const res = await fetch(input, init);
      if (res.status != 200) {
        statusCode = res.status;
        throw new Error();
      }
      return res;
    } catch {
      await sleep(backoff);
      backoff *= 2;
    } finally {
      retryCount -= 1;
    }
  }
  throw new Error(
    `Error while fetching URL: ${String(input)}. Status code: ${statusCode}`,
  );
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
