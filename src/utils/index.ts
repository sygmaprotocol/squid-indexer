/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import { DataSource } from "typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

import type { DbConfig } from "../indexer/config/validator";
import {
  Account,
  Deposit,
  Domain,
  Execution,
  Fee,
  Resource,
  Token,
  Transfer,
} from "../model";
import { Route } from "../model/generated/route.model";

export async function initDatabase(dbConfig: DbConfig): Promise<DataSource> {
  const dataSource = new DataSource({
    type: "postgres",
    host: dbConfig.host,
    database: dbConfig.name,
    port: dbConfig.port,
    username: dbConfig.username,
    password: dbConfig.password,
    entities: [
      Domain,
      Transfer,
      Resource,
      Deposit,
      Execution,
      Account,
      Fee,
      Route,
      Token,
    ],
    namingStrategy: new SnakeNamingStrategy(),
  });
  await dataSource.initialize();
  return dataSource;
}
