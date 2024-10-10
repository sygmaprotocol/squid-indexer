/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import { randomUUID } from "crypto";

import { Network } from "@buildwithsygma/sygma-sdk-core";
import ERC20Contract from "@openzeppelin/contracts/build/contracts/ERC20.json";
import type { ApiPromise } from "@polkadot/api";
import type { MultiLocation } from "@polkadot/types/interfaces";
import { decodeHex } from "@subsquid/evm-processor";
import type { BigNumberish, Provider } from "ethers";
import { AbiCoder, Contract, formatUnits } from "ethers";

import * as FeeHandlerRouter from "../../abi/FeeHandlerRouter.json";
import type * as bridge from "../../abi/bridge";
import type { Domain } from "../../config";
import { DepositType } from "../../config";
import { logger } from "../../utils/logger";
import type { FeeData } from "../../utils/types";

export const nativeTokenAddress = "0x0000000000000000000000000000000000000000";
const STATIC_FEE_DATA = "0x00";
type FeeDataResponse = {
  fee: string;
  tokenAddress: string;
};

export enum ContractType {
  ERC20 = "erc20",
  FEE_ROUTER = "feeRouter",
}

export function parseDestination(
  hexData: string,
  domain: Domain,
  resourceType: DepositType,
  substrateRpcUrlConfig: Map<number, ApiPromise>,
): string {
  const arrayifyData = decodeHex(hexData);
  let recipient = "";
  switch (resourceType) {
    case DepositType.FUNGIBLE:
    case DepositType.NONFUNGIBLE: {
      const recipientlen = Number(
        "0x" + arrayifyData.subarray(32, 64).toString("hex"),
      );
      recipient =
        "0x" + arrayifyData.subarray(64, 64 + recipientlen).toString("hex");
      break;
    }
    case DepositType.PERMISSIONLESS_GENERIC:
      {
        // 32 + 2 + 1 + 1 + 20 + 20
        const lenExecuteFuncSignature = Number(
          "0x" + arrayifyData.subarray(32, 34).toString("hex"),
        );
        const lenExecuteContractAddress = Number(
          "0x" +
            arrayifyData
              .subarray(
                34 + lenExecuteFuncSignature,
                35 + lenExecuteFuncSignature,
              )
              .toString("hex"),
        );
        recipient =
          "0x" +
          arrayifyData
            .subarray(
              35 + lenExecuteFuncSignature,
              35 + lenExecuteFuncSignature + lenExecuteContractAddress,
            )
            .toString("hex");
      }
      break;
    default:
      logger.error(`Unsupported resource type: ${resourceType}`);
      return "";
  }

  let destination = "";
  switch (domain.type) {
    case Network.EVM:
      destination = recipient;
      break;
    case Network.SUBSTRATE: {
      const substrateAPI = substrateRpcUrlConfig.get(domain.id);
      if (!substrateAPI) {
        throw new Error(
          `Substrate domain with id ${domain.id} not found in RPC configuration variable`,
        );
      }
      destination = parseSubstrateDestination(recipient, substrateAPI);
      break;
    }
  }
  return destination;
}

function parseSubstrateDestination(
  recipient: string,
  substrateAPI: ApiPromise,
): string {
  const decodedData = substrateAPI.createType<MultiLocation>(
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
export function decodeAmountsOrTokenId(
  data: string,
  decimals: number,
  resourceType: DepositType,
): string | Error {
  switch (resourceType) {
    case DepositType.FUNGIBLE: {
      const amount = AbiCoder.defaultAbiCoder().decode(
        ["uint256"],
        data,
      )[0] as BigNumberish;
      return formatUnits(amount, decimals);
    }
    case DepositType.NONFUNGIBLE: {
      const tokenId = AbiCoder.defaultAbiCoder().decode(
        ["uint256"],
        data,
      )[0] as bigint;
      return tokenId.toString();
    }
    case DepositType.SEMIFUNGIBLE: {
      return "";
    }
    case DepositType.PERMISSIONLESS_GENERIC: {
      return "";
    }
    case DepositType.PERMISSIONED_GENERIC: {
      return "";
    }
  }
}

export async function getFee(
  event: bridge.DepositEventArgs,
  fromDomain: Domain,
  provider: Provider,
): Promise<FeeData> {
  try {
    const feeRouter = getContract(
      provider,
      fromDomain.feeRouter,
      ContractType.FEE_ROUTER,
    );

    const fee = (await feeRouter.calculateFee(
      event.user,
      fromDomain.id,
      event.destinationDomainID,
      event.resourceID,
      event.data,
      STATIC_FEE_DATA,
    )) as FeeDataResponse;

    let tokenSymbol: string;
    let decimals: number;
    if (fee.tokenAddress != nativeTokenAddress) {
      const token = getContract(provider, fee.tokenAddress, ContractType.ERC20);
      tokenSymbol = (await token.symbol()) as string;
      decimals = Number(await token.decimals());
    } else {
      tokenSymbol = fromDomain.nativeTokenSymbol;
      decimals = fromDomain.nativeTokenDecimals;
    }

    return {
      id: randomUUID(),
      tokenAddress: fee.tokenAddress,
      tokenSymbol: tokenSymbol,
      decimals: decimals,
      amount: fee.fee.toString(),
    };
  } catch (err) {
    logger.error("Calculating fee failed", err);
    return {
      id: randomUUID(),
      tokenAddress: "",
      tokenSymbol: "",
      decimals: 0,
      amount: "0",
    };
  }
}

function getContract(
  provider: Provider,
  contractAddress: string,
  contractType: ContractType,
): Contract {
  switch (contractType) {
    case ContractType.ERC20:
      return new Contract(contractAddress, ERC20Contract.abi, provider);
    case ContractType.FEE_ROUTER:
      return new Contract(contractAddress, FeeHandlerRouter.abi, provider);
  }
}
