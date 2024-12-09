/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/

import { randomUUID } from "crypto";

import { ResourceType } from "@buildwithsygma/core";
import type { Log } from "@subsquid/evm-processor";
import { assertNotNull, decodeHex } from "@subsquid/evm-processor";
import type { JsonRpcProvider, Provider } from "ethers";
import { ethers } from "ethers";

import * as feeRouter from "../../abi/FeeHandlerRouter";
import * as bridge from "../../abi/bridge";
import { decodeAmountOrTokenId, generateTransferID } from "../../indexer/utils";
import { Domain, Resource, Token } from "../../model";
import { SkipNotFoundError } from "../../utils/error";
import { logger } from "../../utils/logger";
import type { Domain as DomainType } from "../config";
import type { IParser } from "../indexer";
import type {
  DecodedDepositLog,
  DecodedProposalExecutionLog,
  DecodedFailedHandlerExecutionLog,
  FeeCollectedData,
} from "../types";

import type { Context } from "./evmProcessor";
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
  constructor(provider: JsonRpcProvider) {
    this.provider = provider;
  }

  public setParsers(parsers: Map<number, IParser>): void {
    this.parsers = parsers;
  }
  public async parseDeposit(
    log: Log,
    fromDomain: DomainType,
    ctx: Context,
  ): Promise<{
    decodedDepositLog: DecodedDepositLog;
    decodedFeeLog: FeeCollectedData;
  }> {
    const event = bridge.events.Deposit.decode(log);
    const destinationParser = this.parsers.get(event.destinationDomainID);
    if (!destinationParser) {
      throw new SkipNotFoundError(
        `Destination domain id ${event.destinationDomainID} not supported`,
      );
    }

    const resource = await ctx.store.findOne(Resource, {
      where: {
        id: event.resourceID.toLowerCase(),
      },
    });

    if (!resource) {
      throw new SkipNotFoundError(
        `Unssupported resource with ID ${event.resourceID}`,
      );
    }
    const transaction = assertNotNull(log.transaction, "Missing transaction");

    const fee = await this.getFee(event, fromDomain, this.provider);
    const token = await ctx.store.findOne(Token, {
      where: {
        tokenAddress: fee.tokenAddress,
        domainID: fromDomain.id.toString(),
      },
    });

    if (!token) {
      throw new SkipNotFoundError(
        `Token with resourceID: ${event.resourceID.toLowerCase()} doesn't exist, skipping`,
      );
    }
    return {
      decodedDepositLog: {
        id: generateTransferID(
          event.depositNonce.toString(),
          fromDomain.id.toString(),
          event.destinationDomainID.toString(),
        ),
        blockNumber: log.block.height,
        depositNonce: event.depositNonce.toString(),
        toDomainID: event.destinationDomainID.toString(),
        sender: transaction.from,
        destination: destinationParser.parseDestination(
          event.data,
          resource.type as ResourceType,
        ),
        fromDomainID: fromDomain.id.toString(),
        resourceID: resource.id,
        txHash: transaction.hash,
        timestamp: new Date(log.block.timestamp),
        depositData: event.data,
        handlerResponse: event.handlerResponse,
        transferType: resource.type,
        amount: decodeAmountOrTokenId(
          event.data,
          token.decimals,
          resource.type as ResourceType,
        ),
      },
      decodedFeeLog: {
        id: randomUUID(),
        amount: fee.amount,
        tokenID: token.id,
        domainID: fromDomain.id.toString(),
        txIdentifier: transaction.hash,
      },
    };
  }

  public async parseEvmRoute(
    txHash: string,
  ): Promise<{ destinationDomainID: number; resourceID: string } | null> {
    const tx = await this.provider.getTransaction(txHash);
    if (tx?.data) {
      const decoded = feeRouter.functions.adminSetResourceHandler.decode(
        tx.data,
      );
      return decoded;
    }
    return null;
  }

  public async parseProposalExecution(
    log: Log,
    toDomain: DomainType,
    ctx: Context,
  ): Promise<DecodedProposalExecutionLog> {
    const event = bridge.events.ProposalExecution.decode(log);
    const transaction = assertNotNull(log.transaction, "Missing transaction");

    const fromDomain = await ctx.store.findOne(Domain, {
      where: { id: event.originDomainID.toString() },
    });
    if (!fromDomain) {
      throw new SkipNotFoundError(
        `Source domain id ${event.originDomainID} not supported`,
      );
    }

    return {
      id: generateTransferID(
        event.depositNonce.toString(),
        event.originDomainID.toString(),
        toDomain.id.toString(),
      ),
      blockNumber: log.block.height,
      depositNonce: event.depositNonce.toString(),
      txHash: transaction.hash,
      timestamp: new Date(log.block.timestamp),
      fromDomainID: fromDomain.id,
      toDomainID: toDomain.id.toString(),
    };
  }

  public async parseFailedHandlerExecution(
    log: Log,
    toDomain: DomainType,
    ctx: Context,
  ): Promise<DecodedFailedHandlerExecutionLog> {
    const event = bridge.events.FailedHandlerExecution.decode(log);
    const transaction = assertNotNull(log.transaction, "Missing transaction");
    const fromDomain = await ctx.store.findOne(Domain, {
      where: { id: event.originDomainID.toString() },
    });
    if (!fromDomain) {
      throw new SkipNotFoundError(
        `Source domain id ${event.originDomainID} not supported`,
      );
    }
    let errMsg;
    try {
      errMsg = ethers.decodeBytes32String(
        "0x" + Buffer.from(event.lowLevelData).subarray(-64).toString(),
      );
    } catch (err) {
      errMsg = "Unknown error type, raw data:" + event.lowLevelData.toString();
    }

    return {
      id: generateTransferID(
        event.depositNonce.toString(),
        event.originDomainID.toString(),
        toDomain.id.toString(),
      ),
      fromDomainID: event.originDomainID.toString(),
      toDomainID: toDomain.id.toString(),
      depositNonce: event.depositNonce.toString(),
      txHash: transaction.hash,
      message: errMsg,
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
    fromDomain: DomainType,
    provider: Provider,
  ): Promise<{ amount: string; tokenAddress: string }> {
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
        tokenAddress: fee.tokenAddress,
        amount: fee.fee.toString(),
      };
    } catch (err) {
      logger.error("Calculating fee failed", err);
      return {
        tokenAddress: "",
        amount: "0",
      };
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
