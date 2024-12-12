/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type { ResourceType } from "@buildwithsygma/core";
import type {
  Log as _Log,
  Transaction as _Transaction,
  EvmBatchProcessor,
  Log,
} from "@subsquid/evm-processor";
import type { SubstrateBatchProcessor } from "@subsquid/substrate-processor";
import { TypeormDatabase } from "@subsquid/typeorm-store";

import {
  Transfer,
  Account,
  Deposit,
  Execution,
  TransferStatus,
  Fee,
} from "../model";
import { Route } from "../model/generated/route.model";
import { logger } from "../utils/logger";

import type { Domain } from "./config";
import type { Context as EvmContext } from "./evmIndexer/evmProcessor";
import type {
  Event,
  Fields,
  Context as SubstrateContext,
} from "./substrateIndexer/substrateProcessor";
import type {
  DecodedDepositLog,
  DecodedEvents,
  DecodedFailedHandlerExecutionLog,
  DecodedProposalExecutionLog,
  DecodedRoutes,
  FeeCollectedData,
  RouteData,
  SubstrateRouteData,
} from "./types";

type Context = EvmContext | SubstrateContext;
export interface IParser {
  setParsers(parsers: Map<number, IParser>): void;
  parseDeposit(
    log: Log | Event,
    fromDomain: Domain,
    ctx: Context,
  ): Promise<{
    decodedDepositLog: DecodedDepositLog;
    decodedFeeLog: FeeCollectedData;
  }>;
  parseProposalExecution(
    log: Log | Event,
    toDomain: Domain,
    ctx: Context,
  ): Promise<DecodedProposalExecutionLog>;
  parseFailedHandlerExecution(
    log: Log | Event,
    toDomain: Domain,
    ctx: Context,
  ): Promise<DecodedFailedHandlerExecutionLog>;
  parseDestination(hexData: string, resourceType: ResourceType): string;
  parseEvmRoute?(txHash: string, ctx: Context): Promise<RouteData>;
  parseSubstrateAsset?(
    call: SubstrateRouteData,
    ctx: Context,
  ): Promise<RouteData>;
}

export interface IProcessor {
  processEvents(ctx: Context, domain: Domain): Promise<DecodedEvents>;
  getProcessor(
    domain: Domain,
  ): EvmBatchProcessor | SubstrateBatchProcessor<Fields>;
}

export class Indexer {
  private domain: Domain;
  private processor: IProcessor;

  constructor(processor: IProcessor, domain: Domain) {
    this.processor = processor;
    this.domain = domain;
  }

  public startProcessing(): void {
    const processorInstance = this.processor.getProcessor(this.domain);
    processorInstance.run(
      new TypeormDatabase({
        stateSchema: this.domain.id.toString(),
        isolationLevel: "READ COMMITTED",
      }),
      async (ctx) => {
        const decodedEvents = await this.processor.processEvents(
          ctx,
          this.domain,
        );
        await this.storeDeposits(ctx, decodedEvents.deposits);
        await this.storeExecutions(ctx, decodedEvents.executions);
        await this.storeFailedExecutions(
          ctx,
          decodedEvents.failedHandlerExecutions,
        );
        await this.storeFees(ctx, decodedEvents.fees);
        await this.storeRoutes(ctx, decodedEvents.routes);
      },
    );
  }

  public async storeDeposits(
    ctx: Context,
    depositsData: DecodedDepositLog[],
  ): Promise<void> {
    const accounts = new Map<string, Account>();
    const deposits = new Map<string, Deposit>();
    const transfers = new Map<string, Transfer>();

    for (const d of depositsData) {
      if (!accounts.has(d.sender)) {
        accounts.set(d.sender, new Account({ id: d.sender }));
      }
    }

    await ctx.store.upsert([...accounts.values()]);

    for (const d of depositsData) {
      const deposit = new Deposit({
        id: d.id,
        txHash: d.txHash,
        blockNumber: d.blockNumber.toString(),
        depositData: d.depositData,
        timestamp: d.timestamp,
        handlerResponse: d.handlerResponse,
        destination: d.destination,
        accountID: d.sender,
      });

      const transfer = new Transfer({
        id: d.id,
        status: TransferStatus.pending,
        deposit: deposit,
        depositNonce: d.depositNonce.toString(),
        amount: d.amount,
        resourceID: d.resourceID,
        fromDomainID: d.fromDomainID,
        toDomainID: d.toDomainID,
      });

      if (!deposits.has(d.id)) {
        deposits.set(d.id, deposit);
      }
      if (!transfers.has(d.id)) {
        transfers.set(d.id, transfer);
      }
    }
    await ctx.store.upsert([...deposits.values()]);
    await ctx.store.upsert([...transfers.values()]);
  }

  public async storeExecutions(
    ctx: Context,
    executionsData: DecodedProposalExecutionLog[],
  ): Promise<void> {
    const executions = new Map<string, Execution>();
    const transfers = new Map<string, Transfer>();
    for (const e of executionsData) {
      const execution = new Execution({
        blockNumber: e.blockNumber.toString(),
        id: e.id,
        timestamp: e.timestamp,
        txHash: e.txHash,
        message: "",
      });

      const transfer = new Transfer({
        id: e.id,
        status: TransferStatus.executed,
        execution: execution,
        fromDomainID: e.fromDomainID,
        toDomainID: e.toDomainID,
        depositNonce: e.depositNonce,
      });

      if (!executions.has(e.id)) {
        executions.set(e.id, execution);
      }
      if (!transfers.has(e.id)) {
        transfers.set(e.id, transfer);
      }
    }
    await ctx.store.upsert([...executions.values()]);
    await ctx.store.upsert([...transfers.values()]);
  }

  public async storeFailedExecutions(
    ctx: Context,
    failedExecutionsData: DecodedFailedHandlerExecutionLog[],
  ): Promise<void> {
    const failedExecutions = new Map<string, Execution>();
    const transfers = new Map<string, Transfer>();
    for (const e of failedExecutionsData) {
      const failedExecution = new Execution({
        blockNumber: e.blockNumber.toString(),
        id: e.id,
        timestamp: e.timestamp,
        txHash: e.txHash,
        message: e.message,
      });

      const transfer = new Transfer({
        id: e.id,
        status: TransferStatus.failed,
        execution: failedExecution,
        fromDomainID: e.fromDomainID,
        toDomainID: e.toDomainID,
        depositNonce: e.depositNonce,
      });

      if (!failedExecutions.has(e.id)) {
        failedExecutions.set(e.id, failedExecution);
      }
      if (!transfers.has(e.id)) {
        transfers.set(e.id, transfer);
      }
    }

    await ctx.store.upsert([...failedExecutions.values()]);
    await ctx.store.upsert([...transfers.values()]);
  }

  public async storeFees(
    ctx: Context,
    feeCollectedData: FeeCollectedData[],
  ): Promise<void> {
    const fees = new Map<string, Fee>();
    const transfers = new Map<string, Transfer>();
    for (const f of feeCollectedData) {
      const transfer = await ctx.store.findOne(Transfer, {
        where: {
          deposit: {
            txHash: f.txIdentifier,
          },
        },
        relations: { deposit: true },
      });
      if (!transfer?.deposit) {
        logger.warn(
          `Deposit for the fee with txHash: ${f.txIdentifier} not found, skipping...`,
        );
        continue;
      }
      if (!fees.has(f.id)) {
        const fee = new Fee({
          id: f.id,
          amount: f.amount,
          tokenID: f.tokenID,
          transferID: transfer.id,
        });
        transfer.fee = fee;

        fees.set(f.id, fee);
        transfers.set(transfer.id, transfer);
      }
    }
    await ctx.store.upsert([...fees.values()]);
    await ctx.store.upsert([...transfers.values()]);
  }

  public async storeRoutes(
    ctx: EvmContext | SubstrateContext,
    routesData: DecodedRoutes[],
  ): Promise<void> {
    const routes = [];
    for (const r of routesData) {
      routes.push(
        new Route({
          fromDomainID: this.domain.id.toString(),
          toDomainID: r.destinationDomainID.toString(),
          resourceID: r.resourceID,
        }),
      );
    }
    await ctx.store.upsert(routes);
  }
}
