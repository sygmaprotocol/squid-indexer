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

import { NotFoundError } from "../../utils/error";
import { logger } from "../../utils/logger";
import { EVMParser } from "../evmIndexer/evmParser";
import type { IParser, IProcessor } from "../indexer";
import { SubstrateParser } from "../substrateIndexer/substrateParser";

import type { EnvVariables } from "./envLoader";

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

type Config = {
  domain: Domain;
  parser: IParser;
};

export async function getConfig(envVars: EnvVariables): Promise<Config> {
  const sharedConfig = await fetchSharedConfig(envVars.sharedConfigURL);

  const domainConfig = getDomainConfig(
    sharedConfig,
    envVars.domainMetadata.domainId!,
    envVars.domainMetadata.domainGateway ?? "",
  );
  let parser: IParser;
  switch (domainConfig.type) {
    case Network.EVM: {
      const provider = new ethers.JsonRpcProvider(
        envVars.domainMetadata.rpcUrl,
      );
      parser = new EVMParser(provider);
      break;
    }
    case Network.SUBSTRATE: {
      parser = new SubstrateParser();
      break;
    }
    default:
      throw new NotFoundError(
        `Domain type: ${domainConfig.type} doesn't exist, skipping`,
      );
  }

  return { domain: domainConfig, parser };
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
