/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type {
  FeeHandler,
  Domain as DomainSDK,
  Resource,
} from "@buildwithsygma/core";

import { getLogger } from "../../utils/logger";

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
    getLogger().error(
      `Failed to fetch shared config for stage: ${process.env.STAGE || "unknown"}`,
      error,
    );
    throw error;
  }
}
