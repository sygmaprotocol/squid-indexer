/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import { randomUUID } from "crypto";
import { assertNotNull } from "@subsquid/evm-processor";
import {
  AbiCoder,
  BigNumberish,
  BytesLike,
  Contract,
  Provider,
  ethers,
  formatUnits,
  getBytes,
} from "ethers";
import { MultiLocation } from "@polkadot/types/interfaces";
import { ApiPromise } from "@polkadot/api";
import { Network, ResourceType } from "@buildwithsygma/sygma-sdk-core";
import ERC20Contract from "@openzeppelin/contracts/build/contracts/ERC20.json";
import * as bridge from "../../abi/bridge";
import { Context, Log } from "../../evmProcessor";
import {
  ContractType,
  DecodedDepositLog,
  DecodedFailedHandlerExecution,
  DecodedProposalExecutionLog,
  DepositType,
  FeeData,
} from "../evmTypes";
import { Domain as DomainConfig } from "../../config";
import { logger } from "../../utils/logger";
import { Transfer } from "../../model";
import * as FeeHandlerRouter from "../../abi/FeeHandlerRouter.json";

export const nativeTokenAddress = "0x0000000000000000000000000000000000000000";
const STATIC_FEE_DATA = "0x00";
type Junction = {
  accountId32?: {
    id: string;
  };
};
type FeeDataResponse = {
  fee: string;
  tokenAddress: string;
};

export async function parseDeposit(
  log: Log,
  fromDomain: DomainConfig,
  toDomain: DomainConfig,
  provider: Provider,
  substrateRpcUrlConfig: Map<number, ApiPromise>
): Promise<DecodedDepositLog> {
  const event = bridge.events.Deposit.decode(log);
  const resource = fromDomain.resources.find(
    (resource) => resource.resourceId == event.resourceID
  )!;
  if (!resource) {
    throw new Error(
      `Resource with ID ${event.resourceID} not found in shared configuration`
    );
  }
  const resourceType = resource.type || "";
  const resourceDecimals = resource.decimals || 18;

  const transaction = assertNotNull(log.transaction, "Missing transaction");

  return {
    id: log.id,
    blockNumber: log.block.height,
    depositNonce: event.depositNonce,
    toDomainID: event.destinationDomainID,
    sender: transaction.from,
    destination: parseDestination(
      event.data as BytesLike,
      toDomain,
      resourceType,
      substrateRpcUrlConfig
    ),
    fromDomainID: Number(fromDomain.id),
    resourceID: resource.resourceId,
    txHash: transaction.hash,
    timestamp: new Date(log.block.timestamp),
    depositData: event.data,
    handlerResponse: event.handlerResponse,
    transferType: resourceType,
    amount: decodeAmountsOrTokenId(
      event.data,
      resourceDecimals,
      resourceType
    ) as string,
    fee: await getFee(log, fromDomain, provider),
  };
}

export function parseDestination(
  hexData: BytesLike,
  domain: DomainConfig,
  resourceType: string,
  substrateRpcUrlConfig: Map<number, ApiPromise>
): string {
  const arrayifyData = getBytes(hexData);
  let recipient = "";
  switch (resourceType) {
    case ResourceType.FUNGIBLE:
    case ResourceType.NON_FUNGIBLE: {
      const recipientlen = Number(
        "0x" + Buffer.from(arrayifyData.slice(32, 64)).toString("hex")
      );
      recipient =
        "0x" +
        Buffer.from(arrayifyData.slice(64, 64 + recipientlen)).toString("hex");
      break;
    }
    case ResourceType.PERMISSIONLESS_GENERIC:
      {
        // 32 + 2 + 1 + 1 + 20 + 20
        const lenExecuteFuncSignature = Number(
          "0x" + Buffer.from(arrayifyData.slice(32, 34)).toString("hex")
        );
        const lenExecuteContractAddress = Number(
          "0x" +
            Buffer.from(
              arrayifyData.slice(
                34 + lenExecuteFuncSignature,
                35 + lenExecuteFuncSignature
              )
            ).toString("hex")
        );
        recipient =
          "0x" +
          Buffer.from(
            arrayifyData.slice(
              35 + lenExecuteFuncSignature,
              35 + lenExecuteFuncSignature + lenExecuteContractAddress
            )
          ).toString("hex");
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
    case Network.SUBSTRATE:
      destination = parseSubstrateDestination(
        recipient,
        substrateRpcUrlConfig.get(domain.id)!
      );
      break;
  }
  return destination;
}

function parseSubstrateDestination(
  recipient: string,
  substrateAPI: ApiPromise
): string {
  const decodedData = substrateAPI.createType("MultiLocation", recipient);
  const multiAddress = decodedData.toJSON() as unknown as MultiLocation;
  for (const [, junctions] of Object.entries(multiAddress.interior)) {
    const junston = junctions as Junction;
    if (junston.accountId32?.id) {
      return junston.accountId32.id;
    }
  }
  return "";
}

function decodeAmountsOrTokenId(
  data: string,
  decimals: number,
  resourceType: string
): string | Error {
  switch (resourceType) {
    case DepositType.FUNGIBLE: {
      const amount = AbiCoder.defaultAbiCoder().decode(
        ["uint256"],
        data
      )[0] as BigNumberish;
      return formatUnits(amount, decimals);
    }
    case DepositType.NONFUNGIBLE: {
      const tokenId = AbiCoder.defaultAbiCoder().decode(
        ["uint256"],
        data
      )[0] as number;
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
    default:
      throw new Error(`Unknown resource type ${resourceType}`);
  }
}

export function parseProposalExecution(
  log: Log,
  toDomain: DomainConfig
): DecodedProposalExecutionLog {
  const event = bridge.events.ProposalExecution.decode(log);
  const transaction = assertNotNull(log.transaction, "Missing transaction");

  return {
    id: log.id,
    blockNumber: log.block.height,
    from: log.transaction!.from,
    depositNonce: event.depositNonce,
    txHash: transaction.hash,
    timestamp: new Date(log.block.timestamp),
    fromDomainID: event.originDomainID,
    toDomainID: Number(toDomain.id),
  };
}

export function parseFailedHandlerExecution(
  log: Log,
  toDomain: DomainConfig
): DecodedFailedHandlerExecution {
  const event = bridge.events.FailedHandlerExecution.decode(log);
  const transaction = assertNotNull(log.transaction, "Missing transaction");

  return {
    id: log.id,
    fromDomainID: event.originDomainID,
    toDomainID: toDomain.id,
    depositNonce: event.depositNonce,
    txHash: transaction.hash,
    message: ethers.decodeBytes32String(
      "0x" + Buffer.from(event.lowLevelData.slice(-64)).toString()
    ),
    blockNumber: log.block.height,
    timestamp: new Date(log.block.timestamp),
  };
}

export async function getFee(
  log: Log,
  fromDomain: DomainConfig,
  provider: Provider
): Promise<FeeData> {
  try {
    const event = bridge.events.Deposit.decode(log);

    const feeRouter = getContract(
      provider,
      fromDomain.feeRouter,
      ContractType.FEE_ROUTER
    );

    const fee = (await feeRouter.calculateFee(
      event.user,
      fromDomain.id,
      event.destinationDomainID,
      event.resourceID,
      event.data,
      STATIC_FEE_DATA
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
  contractType: ContractType
): Contract {
  switch (contractType) {
    case ContractType.ERC20:
      return new Contract(contractAddress, ERC20Contract.abi, provider);
    case ContractType.FEE_ROUTER:
      return new Contract(contractAddress, FeeHandlerRouter.abi, provider);
  }
}

export async function getUpdatedTransfer(
  ctx: Context,
  transferValues: Partial<Transfer>
): Promise<Transfer> {
  const transfer = await ctx.store.findOne(Transfer, {
    where: {
      depositNonce: transferValues.depositNonce!,
      fromDomainID: transferValues.fromDomainID!,
      toDomainID: transferValues.toDomainID!,
    },
  });

  if (!transfer) {
    return new Transfer(transferValues);
  } else {
    Object.assign(transfer, transferValues);
    return transfer;
  }
}
