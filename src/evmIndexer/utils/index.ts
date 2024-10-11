/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import { randomUUID } from "crypto";

import { Network } from "@buildwithsygma/sygma-sdk-core";
import ERC20Contract from "@openzeppelin/contracts/build/contracts/ERC20.json";
import type { ApiPromise } from "@polkadot/api";
import type { MultiLocation } from "@polkadot/types/interfaces";
import { assertNotNull, decodeHex } from "@subsquid/evm-processor";
import type { BigNumberish, Provider } from "ethers";
import { AbiCoder, Contract, ethers, formatUnits } from "ethers";

import * as FeeHandlerRouter from "../../abi/FeeHandlerRouter.json";
import * as bridge from "../../abi/bridge";
import type { Domain } from "../../config";
import type { Log } from "../../evmProcessor";
import type CoinMarketCapService from "../../services/coinmarketcap/coinmarketcap.service";
import type { OfacComplianceService } from "../../services/ofac";
import { generateTransferID } from "../../utils";
import { logger } from "../../utils/logger";
import type {
  DecodedDepositLog,
  DecodedFailedHandlerExecution,
  DecodedProposalExecutionLog,
  FeeData,
} from "../evmTypes";
import { ContractType, DepositType } from "../evmTypes";

export const nativeTokenAddress = "0x0000000000000000000000000000000000000000";
const STATIC_FEE_DATA = "0x00";
type FeeDataResponse = {
  fee: string;
  tokenAddress: string;
};

export async function parseDeposit(
  log: Log,
  fromDomain: Domain,
  toDomain: Domain,
  provider: Provider,
  substrateRpcUrlConfig: Map<number, ApiPromise>,
  coinMarketCapService: CoinMarketCapService,
  ofacComplianceService: OfacComplianceService,
): Promise<DecodedDepositLog> {
  const event = bridge.events.Deposit.decode(log);
  const resource = fromDomain.resources.find(
    (resource) => resource.resourceId == event.resourceID,
  );
  if (!resource) {
    throw new Error(
      `Resource with ID ${event.resourceID} not found in shared configuration`,
    );
  }
  const resourceType = resource.type || "";
  const resourceDecimals = resource.decimals || 18;

  const transaction = assertNotNull(log.transaction, "Missing transaction");

  const amount = decodeAmountsOrTokenId(
    event.data,
    resourceDecimals,
    resourceType,
  ) as string;

  const amountInUSD = await coinMarketCapService.getValueInUSD(
    amount,
    resource.symbol,
    resourceType,
  );

  const senderStatus = await ofacComplianceService.checkSanctionedAddress(
    transaction.from,
  );

  return {
    id: generateTransferID(
      event.depositNonce.toString(),
      fromDomain.id.toString(),
      event.destinationDomainID.toString(),
    ),
    blockNumber: log.block.height,
    depositNonce: event.depositNonce,
    toDomainID: event.destinationDomainID,
    sender: transaction.from,
    destination: parseDestination(
      event.data,
      toDomain,
      resourceType,
      substrateRpcUrlConfig,
    ),
    fromDomainID: fromDomain.id,
    resourceID: resource.resourceId,
    txHash: transaction.hash,
    timestamp: new Date(log.block.timestamp),
    depositData: event.data,
    handlerResponse: event.handlerResponse,
    transferType: resourceType,
    amount: amount,
    senderStatus: senderStatus,
    usdValue: amountInUSD,
    fee: await getFee(event, fromDomain, provider),
  };
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

export function parseProposalExecution(
  log: Log,
  toDomain: Domain,
): DecodedProposalExecutionLog {
  const event = bridge.events.ProposalExecution.decode(log);
  const transaction = assertNotNull(log.transaction, "Missing transaction");

  return {
    id: generateTransferID(
      event.depositNonce.toString(),
      event.originDomainID.toString(),
      toDomain.id.toString(),
    ),
    blockNumber: log.block.height,
    from: log.transaction!.from,
    depositNonce: event.depositNonce,
    txHash: transaction.hash,
    timestamp: new Date(log.block.timestamp),
    fromDomainID: event.originDomainID,
    toDomainID: toDomain.id,
  };
}

export function parseFailedHandlerExecution(
  log: Log,
  toDomain: Domain,
): DecodedFailedHandlerExecution {
  const event = bridge.events.FailedHandlerExecution.decode(log);
  const transaction = assertNotNull(log.transaction, "Missing transaction");

  return {
    id: generateTransferID(
      event.depositNonce.toString(),
      event.originDomainID.toString(),
      toDomain.id.toString(),
    ),
    fromDomainID: event.originDomainID,
    toDomainID: toDomain.id,
    depositNonce: event.depositNonce,
    txHash: transaction.hash,
    message: ethers.decodeBytes32String(
      "0x" + Buffer.from(event.lowLevelData).subarray(-64).toString(),
    ),
    blockNumber: log.block.height,
    timestamp: new Date(log.block.timestamp),
  };
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
