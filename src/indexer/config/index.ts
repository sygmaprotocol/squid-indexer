/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type {
  FeeHandler,
  Domain as DomainSDK,
  Resource,
} from "@buildwithsygma/core";

import { logger } from "../../utils/logger";

import type { EnvVariables } from "./envLoader";

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

export async function getDomainConfig(envVars: EnvVariables): Promise<Domain> {
  const sharedConfig = await fetchSharedConfig(envVars.sharedConfigURL);

  const domainConfig = sharedConfig.domains.find(
    (domain) => domain.id === envVars.domainMetadata.domainId,
  );
  if (!domainConfig) {
    throw new Error(
      `No configuration found for domain ID: ${envVars.domainMetadata.domainId}`,
    );
  }
  domainConfig.gateway = envVars.domainMetadata.domainGateway;
  return domainConfig;
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
