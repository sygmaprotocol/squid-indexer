/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type {
  FeeHandler,
  ResourceType,
  Domain as DomainSDK,
  Resource,
} from "@buildwithsygma/sygma-sdk-core";
import { Network } from "@buildwithsygma/sygma-sdk-core";

import { logger } from "../../utils/logger";
import { EVMParser } from "../evmIndexer/evmParser";
import type { IParser, IProcessor } from "../indexer";
import { SubstrateParser } from "../substrateIndexer/substrateParser";

export type DomainConfig = {
  domainData: Domain;
  parser: IParser;
  processor: IProcessor;
};
export type SharedConfig = {
  domains: Array<Domain>;
};

export type Domain = DomainSDK & {
  bridge: string;
  feeRouter: string;
  feeHandlers: Array<FeeHandler>;
  handlers: Array<Handler>;
  nativeTokenSymbol: string;
  nativeTokenDecimals: number;
  startBlock: number;
  resources: Array<Resource>;
  blockConfirmations: number;
};

type Handler = {
  type: ResourceType;
  address: string;
};

type RpcUrlConfig = Array<{
  id: number;
  endpoint: string;
}>;

type Config = {
  domain: Domain;
  parser: IParser;
  rpcMap: Map<number, string>;
};

export async function getConfig(): Promise<Config> {
  const sharedConfig = await fetchSharedConfig();
  const rpcMap = createRpcMap();
  const parserMap = await initializeParserMap(sharedConfig, rpcMap);

  const domainConfig = getDomainConfig(sharedConfig);
  const parser = getDomainParser(domainConfig, parserMap);

  parser.setParsers(parserMap);

  return { domain: domainConfig, parser, rpcMap: rpcMap };
}

// Fetch and validate the shared configuration
export async function fetchSharedConfig(): Promise<SharedConfig> {
  const sharedConfigURL = process.env.SHARED_CONFIG_URL;

  if (!sharedConfigURL) {
    throw new Error(
      `Shared configuration URL is not defined in the environment.`,
    );
  }

  try {
    const response = await fetch(sharedConfigURL);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch shared config from ${sharedConfigURL}, received status: ${response.status}`,
      );
    }
    return (await response.json()) as SharedConfig;
  } catch (error) {
    logger.error(
      `Failed to fetch shared config for stage: ${process.env.STAGE || "unknown"}`,
      error,
    );
    throw error;
  }
}

// Create RPC URL map from environment configuration
function createRpcMap(): Map<number, string> {
  const rpcEnvVar = process.env.RPC_URL;

  if (!rpcEnvVar) {
    throw new Error("RPC_URL environment variable is not defined.");
  }

  const parsedResponse = JSON.parse(rpcEnvVar) as RpcUrlConfig;
  const rpcUrlMap = new Map<number, string>();

  for (const { id, endpoint } of parsedResponse) {
    rpcUrlMap.set(id, endpoint);
  }

  return rpcUrlMap;
}

// Initialize parser map for all supported domains
async function initializeParserMap(
  sharedConfig: SharedConfig,
  rpcMap: Map<number, string>,
): Promise<Map<number, IParser>> {
  const parserMap = new Map<number, IParser>();

  for (const domain of sharedConfig.domains) {
    const rpcUrl = rpcMap.get(domain.id);
    if (!rpcUrl) {
      throw new Error(
        `Unsupported or missing RPC URL for domain ID: ${domain.id}`,
      );
    }
    switch (domain.type) {
      case Network.EVM: {
        parserMap.set(domain.id, new EVMParser(rpcUrl));
        break;
      }
      case Network.SUBSTRATE: {
        const parser = new SubstrateParser(rpcUrl);
        await parser.initializeSubstrateProvider();
        parserMap.set(domain.id, parser);
        break;
      }
    }
  }

  return parserMap;
}

// Get the domain configuration based on environment domain ID
function getDomainConfig(sharedConfig: SharedConfig): Domain {
  const domainId = Number(process.env.DOMAIN_ID);

  if (isNaN(domainId)) {
    throw new Error(`DOMAIN_ID environment variable is invalid or not set.`);
  }

  const domainConfig = sharedConfig.domains.find(
    (domain) => domain.id === domainId,
  );
  if (!domainConfig) {
    throw new Error(`No configuration found for domain ID: ${domainId}`);
  }

  return domainConfig;
}

// Retrieve the parser for the specified domain
function getDomainParser(
  domainConfig: Domain,
  parserMap: Map<number, IParser>,
): IParser {
  const parser = parserMap.get(domainConfig.id);

  if (!parser) {
    throw new Error(`Parser not initialized for domain ID: ${domainConfig.id}`);
  }

  return parser;
}
