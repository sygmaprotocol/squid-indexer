/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/

import { NotFoundError } from "../../utils/error";

export type DbConfig = {
  host: string;
  name: string;
  port: number;
  username: string;
  password: string;
};

export type DomainMetadata = {
  domainId?: number;
  rpcUrl: string;
  domainGateway?: string;
};

export type EnvVariables = {
  sharedConfigURL: string;
  dbConfig: DbConfig;
  logLevel: string;
  version: string;
};

export function getEnv(): EnvVariables {
  const sharedConfigURL = process.env.SHARED_CONFIG_URL;
  if (!sharedConfigURL) {
    throw new Error(`SHARED_CONFIG_URL is not defined in the environment.`);
  }

  const dbHost = process.env.DB_HOST;
  if (!dbHost) {
    throw new Error(`DB_HOST is not defined in the environment.`);
  }

  const dbName = process.env.DB_NAME;
  if (!dbName) {
    throw new Error(`DB_NAME is not defined in the environment.`);
  }

  const dbPort = parseInt(process.env.DB_PORT || "");
  if (isNaN(dbPort)) {
    throw new Error(`DB_PORT environment variable is invalid or not set.`);
  }

  const dbUsername = process.env.DB_USERNAME;
  if (!dbUsername) {
    throw new Error(`DB_USERNAME is not defined in the environment.`);
  }

  const dbPassword = process.env.DB_PASS;
  if (!dbPassword) {
    throw new Error(`DB_PASS is not defined in the environment.`);
  }

  const logLevel = process.env.LOG_LEVEL || "debug";
  const version = process.env.VERSION || "unknown";

  return {
    sharedConfigURL,
    dbConfig: {
      host: dbHost,
      name: dbName,
      port: dbPort,
      username: dbUsername,
      password: dbPassword,
    },
    logLevel,
    version,
  };
}

export function getDomainMetadata(domainID: string): DomainMetadata {
  const domainMetadata = process.env[`${domainID}_METADATA`];
  if (!domainMetadata) {
    throw new NotFoundError(
      `domain metadata not configured for domain: ${domainID}`,
    );
  }
  return JSON.parse(domainMetadata) as DomainMetadata;
}
