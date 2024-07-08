/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import { XcmAssetId } from "@polkadot/types/interfaces";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { logger } from "../utils/logger";

export type LocalDomainConfig = {
  url: string;
  startBlock: number;
};

export const enum ResourceTypes {
  FUNGIBLE = "fungible",
  NON_FUNGIBLE = "nonfungible",
  PERMISSIONED_GENERIC = "permissionedGeneric",
  PERMISSIONLESS_GENERIC = "permissionlessGeneric",
}

export type SharedConfig = {
  domains: Array<Domain>;
};

export enum DomainTypes {
  EVM = "evm",
  SUBSTRATE = "substrate",
}

export type Domain = {
  id: number;
  name: string;
  type: DomainTypes;
  bridge: string;
  feeRouter: string;
  feeHandlers: Array<FeeHandlerType>;
  handlers: Array<Handler>;
  nativeTokenSymbol: string;
  nativeTokenDecimals: number;
  startBlock: number;
  resources: Array<EvmResource | SubstrateResource>;
};
type Handler = {
  type: ResourceTypes;
  address: string;
};

type FeeHandlerType = {
  type: string;
  address: string;
};

export type EvmResource = {
  resourceId: string;
  type: ResourceTypes;
  address: string;
  symbol: string;
  decimals: number;
};

export type SubstrateResource = {
  resourceId: string;
  type: ResourceTypes;
  address: string;
  symbol: string;
  decimals: number;
  assetName: string;
  xcmMultiAssetId: XcmAssetId;
};

export type RpcUrlConfig = Array<{
  id: number;
  endpoint: string;
}>;

export const getSharedConfig = async (url: string): Promise<SharedConfig> => {
  try {
    const response = await fetch(url);
    return (await response.json()) as SharedConfig;
  } catch (e) {
    logger.error(`Failed to fetch config for ${process.env.STAGE || ""}`, e);
    return Promise.reject(e);
  }
};

export const getSsmDomainConfig = async (
  supportedRPCs: string
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
