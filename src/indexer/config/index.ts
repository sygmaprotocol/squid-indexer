/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type {
  FeeHandler,
  Domain as DomainSDK,
  Resource,
} from "@buildwithsygma/core";
import { Network } from "@buildwithsygma/core";
import { ethers } from "ethers";

import { logger } from "../../utils/logger";
import { EVMParser } from "../evmIndexer/evmParser";
import type { IParser, IProcessor } from "../indexer";
import { SubstrateParser } from "../substrateIndexer/substrateParser";

import type { EnvVariables } from "./validator";

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
  gateway?: string;
};

export enum HandlerType {
  ERC20 = "erc20",
  ERC1155 = "erc1155",
  PERMISSIONLESS_GENERIC = "permissionlessGeneric",
  ERC721 = "erc721",
  NATIVE = "native",
}

type Handler = {
  type: HandlerType;
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

export async function getConfig(envVars: EnvVariables): Promise<Config> {
  const sharedConfig = await fetchSharedConfig(envVars.sharedConfigURL);
  const rpcMap = createRpcMap(envVars.rpcUrls);
  const parserMap = initializeParserMap(sharedConfig, rpcMap);

  const domainConfig = getDomainConfig(
    sharedConfig,
    envVars.domainId,
    envVars.domainGateway,
  );
  const parser = getDomainParser(domainConfig.id, parserMap);

  return { domain: domainConfig, parser, rpcMap: rpcMap };
}

export async function fetchSharedConfig(url: string): Promise<SharedConfig> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch shared config from ${url}, received status: ${response.status}`,
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

function createRpcMap(rpcUrls: string): Map<number, string> {
  const parsedResponse = JSON.parse(rpcUrls) as RpcUrlConfig;
  const rpcUrlMap = new Map<number, string>();

  for (const { id, endpoint } of parsedResponse) {
    rpcUrlMap.set(id, endpoint);
  }

  return rpcUrlMap;
}

function initializeParserMap(
  sharedConfig: SharedConfig,
  rpcMap: Map<number, string>,
): Map<number, IParser> {
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
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        parserMap.set(domain.id, new EVMParser(provider));
        break;
      }
      case Network.SUBSTRATE: {
        parserMap.set(domain.id, new SubstrateParser());
        break;
      }
    }
  }

  return parserMap;
}

function getDomainConfig(
  sharedConfig: SharedConfig,
  domainId: number,
  domainGateway: string,
): Domain {
  const domainConfig = sharedConfig.domains.find(
    (domain) => domain.id === domainId,
  );
  if (!domainConfig) {
    throw new Error(`No configuration found for domain ID: ${domainId}`);
  }
  domainConfig.gateway = domainGateway;
  return domainConfig;
}

function getDomainParser(
  domainID: number,
  parserMap: Map<number, IParser>,
): IParser {
  const parser = parserMap.get(domainID);

  if (!parser) {
    throw new Error(`Parser not initialized for domain ID: ${domainID}`);
  }

  return parser;
}
