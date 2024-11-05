/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import { ResourceType } from "@buildwithsygma/core";
import type { BigNumberish } from "ethers";
import { AbiCoder, formatUnits } from "ethers";

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
