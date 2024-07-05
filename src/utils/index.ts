/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import { DataSource } from "typeorm";
import { Account, Deposit, Domain, Execution, Fee, Resource, Transfer} from '../model'
import { SnakeNamingStrategy } from "typeorm-naming-strategies"


export async function initDatabase(): Promise<DataSource>{
    const dataSource = new DataSource({
        type: "postgres",
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT || ""),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASS,
        entities: [Domain, Transfer, Resource, Deposit, Execution, Account, Fee],
        namingStrategy: new SnakeNamingStrategy()
    })
    await dataSource.initialize()
    return dataSource
}