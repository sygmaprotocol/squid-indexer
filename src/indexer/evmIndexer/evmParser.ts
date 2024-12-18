/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/

import { randomUUID } from "crypto";

import type { Network, ResourceType } from "@buildwithsygma/core";
import type { Log } from "@subsquid/evm-processor";
import { assertNotNull } from "@subsquid/evm-processor";
import type { JsonRpcProvider, Provider } from "ethers";
import { ethers } from "ethers";
import type winston from "winston";

import * as bridge from "../../abi/bridge";
import {
  decodeAmountOrTokenId,
  generateTransferID,
  parseDestination,
} from "../../indexer/utils";
import { Domain, Resource, Route, Token } from "../../model";
import { NotFoundError } from "../../utils/error";
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
  private logger: winston.Logger;
  constructor(provider: JsonRpcProvider, logger: winston.Logger) {
    this.provider = provider;
    this.logger = logger;
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
    const destinationDomain = await ctx.store.findOne(Domain, {
      where: {
        id: event.destinationDomainID.toString(),
      },
    });
    if (!destinationDomain) {
      throw new NotFoundError(
        `Destination domain id ${event.destinationDomainID} not supported`,
      );
    }

    const resource = await ctx.store.findOne(Resource, {
      where: {
        id: event.resourceID.toLowerCase(),
      },
    });

    if (!resource) {
      throw new NotFoundError(
        `Unsupported resource with ID ${event.resourceID}`,
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
      throw new NotFoundError(
        `Token with resourceID: ${event.resourceID.toLowerCase()} doesn't exist, skipping`,
      );
    }

    let route = await ctx.store.findOne(Route, {
      where: {
        fromDomainID: fromDomain.id.toString(),
        toDomainID: event.destinationDomainID.toString(),
        resourceID: resource.id,
      },
    });
    if (!route) {
      route = new Route({
        fromDomainID: fromDomain.id.toString(),
        toDomainID: event.destinationDomainID.toString(),
        resourceID: resource.id,
      });

      await ctx.store.insert(route);
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
        sender: transaction.from,
        destination: parseDestination(
          destinationDomain.type as Network,
          event.data,
          resource.type as ResourceType,
        ),
        routeID: route.id,
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
        txIdentifier: transaction.hash,
      },
    };
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
      throw new NotFoundError(
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
      fromDomainID: fromDomain.id.toString(),
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
      throw new NotFoundError(
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
        fromDomain.id.toString(),
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
      this.logger.error("Calculating fee failed", err);
      return {
        tokenAddress: "",
        amount: "0",
      };
    }
  }
}
