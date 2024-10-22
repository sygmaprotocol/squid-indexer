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
import { EVMProcessor } from "../evmIndexer/evmProcessor";
import type { IParser, IProcessor } from "../indexer";

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

export const getSharedConfig = async (): Promise<SharedConfig> => {
  try {
    const sharedConfigURL = process.env.SHARED_CONFIG_URL!;
    if (!sharedConfigURL) {
      throw new Error(`shared configuration URL is not defined or invalid`);
    }
    const response = await fetch(sharedConfigURL);
    return (await response.json()) as SharedConfig;
  } catch (e) {
    logger.error(`Failed to fetch config for ${process.env.STAGE || ""}`, e);
    return Promise.reject(e);
  }
};

export const getRpcMap = (): Map<number, string> => {
  const parsedResponse = JSON.parse(process.env.RPC_URL || "") as RpcUrlConfig;
  const rpcUrlMap = new Map<number, string>();
  for (const rpcConfig of parsedResponse) {
    rpcUrlMap.set(rpcConfig.id, rpcConfig.endpoint);
  }

  return rpcUrlMap;
};

export function getDomainConfig(
  sharedConfig: SharedConfig,
  rpcUrl: Map<number, string>,
): Map<number, DomainConfig> {
  const domainConfig = new Map<number, DomainConfig>();
  for (const domain of sharedConfig.domains) {
    if (domain.type == Network.EVM) {
      const parser = new EVMParser(rpcUrl.get(domain.id) || "");
      const processor = new EVMProcessor();
      domainConfig.set(domain.id, { parser, domainData: domain, processor });
    }
  }

  return domainConfig;
}
