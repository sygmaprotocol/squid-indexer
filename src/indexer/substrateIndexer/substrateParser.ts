/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/

import { ResourceType } from "@buildwithsygma/core";
import { ApiPromise, WsProvider } from "@polkadot/api";
import type { MultiLocation } from "@polkadot/types/interfaces";
import { decodeHex } from "@subsquid/evm-processor";

import { logger } from "../../utils/logger";

export class SubstrateParser {
  private provider!: ApiPromise;

  public async init(rpcUrl: string): Promise<void> {
    const wsProvider = new WsProvider(rpcUrl);
    const api = await ApiPromise.create({
      provider: wsProvider,
    });
    this.provider = api;
  }

  public parseDestination(hexData: string, resourceType: ResourceType): string {
    const arrayifyData = decodeHex(hexData);
    let recipient = "";
    switch (resourceType) {
      case ResourceType.FUNGIBLE:
      case ResourceType.NON_FUNGIBLE: {
        const recipientlen = Number(
          "0x" + arrayifyData.subarray(32, 64).toString("hex"),
        );
        recipient =
          "0x" + arrayifyData.subarray(64, 64 + recipientlen).toString("hex");
        break;
      }
      default:
        logger.error(`Unsupported resource type: ${resourceType}`);
        return "";
    }
    const decodedData = this.provider.createType<MultiLocation>(
      "MultiLocation",
      recipient,
    );

    const junction = decodedData.interior;
    if (junction.isX1) {
      if (junction.asX1.isAccountId32) {
        return junction.asX1.asAccountId32.id.toString();
      }
    }
    return "";
  }
}
