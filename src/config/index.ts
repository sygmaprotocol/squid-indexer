/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type {
  FeeHandler,
  ResourceType,
  Domain as DomainSDK,
} from "@buildwithsygma/sygma-sdk-core";
import { Network } from "@buildwithsygma/sygma-sdk-core";
import { ApiPromise, WsProvider } from "@polkadot/api";

import type { EvmResource, SubstrateResource } from "../evmIndexer/evmTypes";
import { logger } from "../utils/logger";

export type DomainConfig = {
  domainID: number;
  domainType: Network;
  rpcURL: string;
  supportedSubstrateRPCs: string;
};

export type ProcessorConfig = {
  contractAddress: string;
  gateway?: string;
  rpcURL: string;
  startBlock: number;
  numberOfConfirmations: number;
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
  resources: Array<EvmResource | SubstrateResource>;
};

type Handler = {
  type: ResourceType;
  address: string;
};

type RpcUrlConfig = Array<{
  id: number;
  endpoint: string;
}>;

export function getProcessorConfig(): ProcessorConfig {
  const processorConfig: ProcessorConfig = {
    contractAddress: process.env.DOMAIN_BRIDGE_ADDRESS!,
    gateway: process.env.DOMAIN_GATEWAY || "",
    rpcURL: process.env.RPC_URL!,
    numberOfConfirmations: Number(process.env.DOMAIN_CONFIRMATIONS),
    startBlock: Number(process.env.START_BLOCK!),
  };
  const { gateway, ...requiredConfig } = processorConfig;
  validateConfig(requiredConfig);
  return processorConfig;
}

export function getDomainConfig(): DomainConfig {
  const domainType = process.env.DOMAIN_TYPE;
  if (!domainType || !Object.values(Network).includes(domainType as Network)) {
    throw new Error("Domain type missing or invalid");
  }
  const domainConfig: DomainConfig = {
    domainID: Number(process.env.DOMAIN_ID),
    rpcURL: process.env.RPC_URL!,
    supportedSubstrateRPCs: process.env.SUPPORTED_SUBSTRATE_RPCS!,
    domainType: domainType as Network,
  };
  validateConfig(domainConfig);
  return domainConfig;
}

function validateConfig(config: Record<string, number | string>): void {
  for (const [key, value] of Object.entries(config)) {
    if (!value) {
      throw new Error(`${key} is not defined or invalid`);
    }
  }
}

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

export const getSsmDomainConfig = async (
  supportedRPCs: string,
): Promise<Map<number, ApiPromise>> => {
  const parsedResponse = JSON.parse(supportedRPCs) as RpcUrlConfig;
  const rpcUrlMap = new Map<number, ApiPromise>();
  for (const rpcConfig of parsedResponse) {
    const wsProvider = new WsProvider(rpcConfig.endpoint);
    const api = await ApiPromise.create({
      provider: wsProvider,
    });
    rpcUrlMap.set(rpcConfig.id, api);
  }

  return rpcUrlMap;
};
