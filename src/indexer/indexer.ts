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
import type { Store } from "@subsquid/typeorm-store";
import { TypeormDatabase } from "@subsquid/typeorm-store";

import {
  Transfer,
  Account,
  Deposit,
  Execution,
  Fee,
  TransferStatus,
} from "../model";

import type { Domain } from "./config";
import type { Context } from "./evmIndexer/evmProcessor";
import type {
  Event,
  Fields,
  ProcessorContext,
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
  ): Promise<DecodedDepositLog> | DecodedDepositLog;
  parseProposalExecution(
    log: Log | Event,
    toDomain: Domain,
  ): DecodedProposalExecutionLog;
  parseFailedHandlerExecution(
    log: Log | Event,
    toDomain: Domain,
  ): DecodedFailedHandlerExecutionLog;
  parseDestination(hexData: string, resourceType: ResourceType): string;
}

export interface IProcessor {
  processEvents(
    ctx: Context | ProcessorContext<Store>,
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
    ctx: Context | ProcessorContext<Store>,
    depositsData: DecodedDepositLog[],
  ): Promise<void> {
    const accounts = new Map<string, Account>();
    const fees = new Map<string, Fee>();
    const deposits = new Map<string, Deposit>();
    const transfers = new Map<string, Transfer>();

    for (const d of depositsData) {
      if (!accounts.has(d.sender)) {
        accounts.set(d.sender, new Account({ id: d.sender }));
      }
      if (!fees.has(d.fee.id)) {
        fees.set(d.fee.id, new Fee(d.fee));
      }
    }

    await ctx.store.upsert([...accounts.values()]);
    await ctx.store.upsert([...fees.values()]);

    for (const d of depositsData) {
      const deposit = new Deposit({
        id: d.id,
        type: d.transferType,
        txHash: d.txHash,
        blockNumber: d.blockNumber.toString(),
        depositData: d.depositData,
        timestamp: d.timestamp,
        handlerResponse: d.handlerResponse,
      });

      const transfer = new Transfer({
        id: d.id,
        depositNonce: d.depositNonce,
        amount: d.amount,
        destination: d.destination,
        status: TransferStatus.pending,
        message: "",
        resourceID: d.resourceID,
        fromDomainID: d.fromDomainID,
        toDomainID: d.toDomainID,
        accountID: d.sender,
        deposit: deposit,
        fee: new Fee(d.fee),
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
    ctx: Context | ProcessorContext<Store>,
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
      });

      const transfer = new Transfer({
        id: e.id,
        depositNonce: e.depositNonce,
        amount: null,
        destination: null,
        status: TransferStatus.executed,
        message: "",
        fromDomainID: e.fromDomainID,
        toDomainID: e.toDomainID,
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
    ctx: Context | ProcessorContext<Store>,
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
      });

      const transfer = new Transfer({
        id: e.id,
        depositNonce: e.depositNonce,
        amount: null,
        destination: null,
        status: TransferStatus.failed,
        message: e.message,
        fromDomainID: e.fromDomainID,
        toDomainID: e.toDomainID,
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
    ctx: Context | ProcessorContext<Store>,
    feeCollectedData: FeeCollectedData[],
  ): Promise<void> {
    const fees = new Map<string, Fee>();
    for (const f of feeCollectedData) {
      if (!fees.has(f.id)) {
        const fee = new Fee({
          id: f.id,
          amount: f.amount,
          decimals: f.decimals,
          tokenAddress: f.tokenAddress,
          tokenSymbol: f.tokenSymbol,
        });
        fees.set(f.id, fee);
      }
    }
    await ctx.store.upsert([...fees.values()]);

    const transfersToUpdate = new Map<string, Transfer>();
    for (const f of feeCollectedData) {
      const transfer = await ctx.store.findOne(Transfer, {
        where: {
          deposit: {
            txHash: f.txIdentifier,
          },
        },
      });
      if (transfer) {
        transfer.fee = fees.get(f.id);
        transfersToUpdate.set(transfer.id, transfer);
      }
    }
    await ctx.store.upsert([...transfersToUpdate.values()]);
  }
}
