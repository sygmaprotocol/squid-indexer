/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import { Network, ResourceType } from "@buildwithsygma/core";
import { TypeRegistry } from "@polkadot/types";
import type { MultiLocation } from "@polkadot/types/interfaces";
import { decodeHex } from "@subsquid/evm-processor";
import type { BigNumberish } from "ethers";
import { AbiCoder, formatUnits } from "ethers";

import { NotFoundError } from "../utils/error";
import { logger } from "../utils/logger";

export function generateTransferID(
  depositNonce: string,
  fromDomainID: string,
  toDomainID: string,
): string {
  return depositNonce + "-" + fromDomainID + "-" + toDomainID;
}

export function decodeAmountOrTokenId(
  data: string,
  decimals: number,
  resourceType: ResourceType,
): string {
  switch (resourceType) {
    case ResourceType.FUNGIBLE: {
      const amount = AbiCoder.defaultAbiCoder().decode(
        ["uint256"],
        data,
      )[0] as BigNumberish;
      return formatUnits(amount, decimals);
    }
    case ResourceType.NON_FUNGIBLE: {
      const tokenId = AbiCoder.defaultAbiCoder().decode(
        ["uint256"],
        data,
      )[0] as bigint;
      return tokenId.toString();
    }
    default:
      return "";
  }
}

export function parseDestination(
  domainType: Network,
  hexData: string,
  resourceType: ResourceType,
): string {
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
    case ResourceType.PERMISSIONLESS_GENERIC:
      recipient = decodeGenericCall(arrayifyData);
      break;
    default:
      logger.error(`Unsupported resource type: ${resourceType}`);
      throw new NotFoundError(`Unsupported resource type: ${resourceType}`);
  }

  switch (domainType) {
    case Network.EVM: {
      return recipient;
    }
    case Network.SUBSTRATE: {
      const registry = new TypeRegistry();
      const decodedData = registry.createType<MultiLocation>(
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
    default:
      throw new NotFoundError(
        `Domain type: ${domainType} doesn't exist, skipping`,
      );
  }
}

function decodeGenericCall(genericCallData: Buffer): string {
  // 32 + 2 + 1 + 1 + 20 + 20
  const lenExecuteFuncSignature = Number(
    "0x" + genericCallData.subarray(32, 34).toString("hex"),
  );
  const lenExecuteContractAddress = Number(
    "0x" +
      genericCallData
        .subarray(34 + lenExecuteFuncSignature, 35 + lenExecuteFuncSignature)
        .toString("hex"),
  );
  const recipient =
    "0x" +
    genericCallData
      .subarray(
        35 + lenExecuteFuncSignature,
        35 + lenExecuteFuncSignature + lenExecuteContractAddress,
      )
      .toString("hex");

  return recipient;
}
