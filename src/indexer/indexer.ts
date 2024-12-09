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
  DecodedFailedHandlerExecutionLog,
  DecodedProposalExecutionLog,
  FeeCollectedData,
} from "./types";

export interface IParser {
  setParsers(parsers: Map<number, IParser>): void;
  parseDeposit(
    log: Log | Event,
    fromDomain: Domain,
    ctx: EvmContext | SubstrateContext,
  ): Promise<{
    decodedDepositLog: DecodedDepositLog;
    decodedFeeLog: FeeCollectedData;
  }>;
  parseProposalExecution(
    log: Log | Event,
    toDomain: Domain,
    ctx: EvmContext | SubstrateContext,
  ): Promise<DecodedProposalExecutionLog>;
  parseFailedHandlerExecution(
    log: Log | Event,
    toDomain: Domain,
    ctx: EvmContext | SubstrateContext,
  ): Promise<DecodedFailedHandlerExecutionLog>;
  parseDestination(hexData: string, resourceType: ResourceType): string;
}

export interface IProcessor {
  processEvents(
    ctx: EvmContext | SubstrateContext,
    domain: Domain,
  ): Promise<DecodedEvents> | DecodedEvents;
  getProcessor(
    domain: Domain,
  ): EvmBatchProcessor | SubstrateBatchProcessor<Fields>;
}

export type DecodedEvents = {
  deposits: DecodedDepositLog[];
  executions: DecodedProposalExecutionLog[];
  failedHandlerExecutions: DecodedFailedHandlerExecutionLog[];
  fees: FeeCollectedData[];
};
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
      },
    );
  }

  public async storeDeposits(
    ctx: EvmContext | SubstrateContext,
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
        type: d.transferType,
        txHash: d.txHash,
        blockNumber: d.blockNumber.toString(),
        depositData: d.depositData,
        timestamp: d.timestamp,
        handlerResponse: d.handlerResponse,
        depositNonce: d.depositNonce.toString(),
        amount: d.amount,
        destination: d.destination,
        resourceID: d.resourceID,
        fromDomainID: d.fromDomainID,
        toDomainID: d.toDomainID,
        accountID: d.sender,
      });

      const transfer = new Transfer({
        id: d.id,
        status: TransferStatus.pending,
        deposit: deposit,
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
    ctx: EvmContext | SubstrateContext,
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
    ctx: EvmContext | SubstrateContext,
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
    ctx: EvmContext | SubstrateContext,
    feeCollectedData: FeeCollectedData[],
  ): Promise<void> {
    const fees = new Map<string, Fee>();
    const deposits = new Map<string, Deposit>();
    for (const f of feeCollectedData) {
      const deposit = await ctx.store.findOne(Deposit, {
        where: { txHash: f.txIdentifier },
      });
      if (!deposit) {
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
          depositID: deposit.id,
          domainID: f.domainID,
        });
        deposit.fee = fee;

        fees.set(f.id, fee);
        deposits.set(deposit.id, deposit);
      }
    }
    await ctx.store.upsert([...fees.values()]);
    await ctx.store.upsert([...deposits.values()]);
  }
}
