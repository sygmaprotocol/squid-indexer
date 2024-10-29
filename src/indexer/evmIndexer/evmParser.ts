/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/

import { randomUUID } from "crypto";

import { ResourceType } from "@buildwithsygma/core";
import type { Log } from "@subsquid/evm-processor";
import { assertNotNull, decodeHex } from "@subsquid/evm-processor";
import type { BigNumberish, JsonRpcProvider, Provider } from "ethers";
import { AbiCoder, ethers, formatUnits } from "ethers";

import * as bridge from "../../abi/bridge";
import { logger } from "../../utils/logger";
import type { Domain, Token } from "../config";
import type { IParser } from "../indexer";
import type {
  DecodedDepositLog,
  DecodedFailedHandlerExecution,
  DecodedProposalExecutionLog,
  FeeData,
} from "../types";
import { generateTransferID } from "../utils";

import { ContractType } from "./evmTypes";
import { getContract } from "./utils";

type FeeDataResponse = {
  fee: string;
  tokenAddress: string;
};

export class EVMParser implements IParser {
  private STATIC_FEE_DATA = "0x00";
  private provider: JsonRpcProvider;
  private parsers!: Map<number, IParser>;
  private tokens: Map<string, Token>;
  constructor(provider: JsonRpcProvider, tokens: Map<string, Token>) {
    this.provider = provider;
    this.tokens = tokens;
  }

  public setParsers(parsers: Map<number, IParser>): void {
    this.parsers = parsers;
  }
  public async parseDeposit(
    log: Log,
    fromDomain: Domain,
  ): Promise<DecodedDepositLog> {
    const event = bridge.events.Deposit.decode(log);
    const destinationParser = this.parsers.get(event.destinationDomainID);
    if (!destinationParser) {
      throw new Error(
        `Destination domain id ${event.destinationDomainID} not supported`,
      );
    }
    const resource = fromDomain.resources.find(
      (resource) =>
        resource.resourceId.toLowerCase() == event.resourceID.toLowerCase(),
    );
    if (!resource) {
      throw new Error(
        `Resource with ID ${event.resourceID} not found in shared configuration`,
      );
    }
    const resourceType = resource.type || "";
    const resourceDecimals = resource.decimals || 18;

    const transaction = assertNotNull(log.transaction, "Missing transaction");

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
      destination: destinationParser.parseDestination(event.data, resourceType),
      fromDomainID: fromDomain.id,
      resourceID: resource.resourceId,
      txHash: transaction.hash,
      timestamp: new Date(log.block.timestamp),
      depositData: event.data,
      handlerResponse: event.handlerResponse,
      transferType: resourceType,
      amount: this.decodeAmountsOrTokenId(
        event.data,
        resourceDecimals,
        resourceType,
      ),
      fee: await this.getFee(event, fromDomain, this.provider),
    };
  }

  public parseProposalExecution(
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
      depositNonce: event.depositNonce,
      txHash: transaction.hash,
      timestamp: new Date(log.block.timestamp),
      fromDomainID: event.originDomainID,
      toDomainID: toDomain.id,
    };
  }

  public parseFailedHandlerExecution(
    log: Log,
    toDomain: Domain,
  ): DecodedFailedHandlerExecution {
    const event = bridge.events.FailedHandlerExecution.decode(log);
    const transaction = assertNotNull(log.transaction, "Missing transaction");

    const lowLevelDataBuffer = Buffer.from(event.lowLevelData, "hex");

    const byteOffset = Math.max(lowLevelDataBuffer.length - 64, 0);
    const length = lowLevelDataBuffer.length - byteOffset;
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
        "0x" +
          Buffer.from(
            lowLevelDataBuffer.buffer,
            lowLevelDataBuffer.byteOffset + byteOffset,
            length,
          ).toString("hex"),
      ),
      blockNumber: log.block.height,
      timestamp: new Date(log.block.timestamp),
    };
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
      case ResourceType.PERMISSIONLESS_GENERIC:
        recipient = this.decodeGenericCall(arrayifyData);
        break;
      default:
        logger.error(`Unsupported resource type: ${resourceType}`);
        return "";
    }
    return recipient;
  }

  public async getFee(
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
        this.STATIC_FEE_DATA,
      )) as FeeDataResponse;

      return {
        id: randomUUID(),
        tokenAddress: fee.tokenAddress,
        tokenSymbol:
          this.tokens.get(fee.tokenAddress.toLowerCase())?.symbol || "",
        decimals:
          this.tokens.get(fee.tokenAddress.toLowerCase())?.decimals || 18,
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

  private decodeAmountsOrTokenId(
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

  private decodeGenericCall(genericCallData: Buffer): string {
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
}
