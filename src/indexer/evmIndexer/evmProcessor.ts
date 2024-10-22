/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import { EvmBatchProcessor } from "@subsquid/evm-processor";

import * as bridge from "../../abi/bridge";
import {
  Transfer,
  Account,
  Deposit,
  Execution,
  Fee,
  TransferStatus,
} from "../../model";
import type { Domain } from "../config";
import type { Context, IProcessor } from "../indexer";
import type {
  DecodedDepositLog,
  DecodedFailedHandlerExecution,
  DecodedProposalExecutionLog,
} from "../types";

export class EVMProcessor implements IProcessor {
  public getProcessor(
    rpcUrls: Map<number, string>,
    domain: Domain,
  ): EvmBatchProcessor {
    const evmProcessor = new EvmBatchProcessor()
      .setRpcEndpoint({
        url: rpcUrls.get(domain.id) || "",
        rateLimit: 10,
      })
      .setBlockRange({ from: domain.startBlock })
      .setFinalityConfirmation(domain.blockConfirmations)
      .setFields({
        log: {
          topics: true,
        },
      })
      .addLog({
        address: [domain.bridge],
        topic0: [bridge.events.ProposalExecution.topic],
        transaction: true,
      })
      .addLog({
        address: [domain.bridge],
        topic0: [bridge.events.Deposit.topic],
        transaction: true,
      })
      .addLog({
        address: [domain.bridge],
        topic0: [bridge.events.FailedHandlerExecution.topic],
        transaction: true,
      });

    if (process.env.DOMAIN_GATEWAY) {
      evmProcessor.setGateway(process.env.DOMAIN_GATEWAY);
    }
    return evmProcessor;
  }

  public async processDeposits(
    ctx: Context,
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

  public async processExecutions(
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

  public async processFailedExecutions(
    ctx: Context,
    failedExecutionsData: DecodedFailedHandlerExecution[],
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
}
