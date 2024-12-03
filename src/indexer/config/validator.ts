/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/

export type DbConfig = {
  host: string;
  name: string;
  port: number;
  username: string;
  password: string;
};

export type DomainMetadata = {
  [domainID: number]: {
    iconUrl: string;
    explorerUrl: string;
  };
};

type EnvVariables = {
  sharedConfigURL: string;
  dbConfig: DbConfig;
};

export type EnvInitVariables = {
  sharedConfigURL: string;
  dbConfig: DbConfig;
  domainMetadata: DomainMetadata;
  logLevel: string;
  version: string;
};

export type EnvIndexerVariables = {
  sharedConfigURL: string;
  rpcUrls: string;
  domainId: number;
  domainGateway: string;
};

function getEnv(): EnvVariables {
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

  return {
    sharedConfigURL: sharedConfigURL,
    dbConfig: {
      host: dbHost,
      name: dbName,
      port: dbPort,
      username: dbUsername,
      password: dbPassword,
    },
  };
}

export function getInitEnv(): EnvInitVariables {
  const coreEnvs = getEnv();

  let domainMetadata: DomainMetadata;
  if (process.env.SYG_CHAINS) {
    try {
      domainMetadata = JSON.parse(process.env.SYG_CHAINS) as DomainMetadata;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`SYG_CHAINS is not a valid JSON: ${error.message}`);
      } else {
        throw new Error(
          `SYG_CHAINS is not a valid JSON: Unknown error occurred`,
        );
      }
    }
  } else {
    throw new Error(`SYG_CHAINS is not defined in the environment.`);
  }

  const logLevel = process.env.LOG_LEVEL || "debug";
  const version = process.env.VERSION || "unknown";

  return {
    sharedConfigURL: coreEnvs.sharedConfigURL,
    dbConfig: coreEnvs.dbConfig,
    domainMetadata: domainMetadata,
    logLevel,
    version,
  };
}

export function getIndexerEnv(): EnvIndexerVariables {
  const coreEnvs = getEnv();

  const rpcUrls = process.env.RPC_URL;
  if (!rpcUrls) {
    throw new Error(`RPC_URL environment variable is not defined.`);
  }

  const domainId = Number(process.env.DOMAIN_ID);
  if (isNaN(domainId)) {
    throw new Error(`DOMAIN_ID environment variable is invalid or not set.`);
  }

  const domainGateway = process.env.DOMAIN_GATEWAY || "";

  return {
    sharedConfigURL: coreEnvs.sharedConfigURL,
    domainGateway: domainGateway,
    domainId: domainId,
    rpcUrls: rpcUrls,
  };
}
