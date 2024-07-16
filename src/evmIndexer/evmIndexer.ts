/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type { Context } from "../evmProcessor";
import type { Transfer } from "../model";
import { Account, Deposit, Execution, Fee, TransferStatus } from "../model";

import type {
  DecodedDepositLog,
  DecodedFailedHandlerExecution,
  DecodedProposalExecutionLog,
} from "./evmTypes";
import { getUpdatedTransfer } from "./utils";

export async function processDeposits(
  ctx: Context,
  depositsData: DecodedDepositLog[],
): Promise<void> {
  const deposits = new Set<Deposit>();
  const transfers = new Set<Transfer>();
  for (const d of depositsData) {
    const account = new Account({ id: d.sender });
    await ctx.store.upsert(account);

    const fee = new Fee(d.fee);
    await ctx.store.upsert(fee);

    const deposit = new Deposit({
      id: d.id,
      type: d.transferType,
      txHash: d.txHash,
      blockNumber: d.blockNumber.toString(),
      depositData: d.depositData,
      timestamp: d.timestamp,
      handlerResponse: d.handlerResponse,
    });

    const transfer = await getUpdatedTransfer(ctx, {
      id: d.id,
      depositNonce: d.depositNonce,
      amount: d.amount,
      destination: d.destination,
      status: TransferStatus.pending,
      message: "",
      resourceID: d.resourceID,
      fromDomainID: d.fromDomainID,
      toDomainID: d.toDomainID,
      account: account,
      deposit: deposit,
      fee: fee,
    });

    deposits.add(deposit);
    transfers.add(transfer);
  }
  await ctx.store.upsert([...deposits.values()]);
  await ctx.store.upsert([...transfers.values()]);
}

export async function processExecutions(
  ctx: Context,
  executionsData: DecodedProposalExecutionLog[],
): Promise<void> {
  const executions = new Set<Execution>();
  const transfers = new Set<Transfer>();
  for (const e of executionsData) {
    const execution = new Execution({
      blockNumber: e.blockNumber.toString(),
      id: e.id,
      timestamp: e.timestamp,
      txHash: e.txHash,
    });

    const transfer = await getUpdatedTransfer(ctx, {
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

    executions.add(execution);
    transfers.add(transfer);
  }
  await ctx.store.upsert([...executions.values()]);
  await ctx.store.upsert([...transfers.values()]);
}

export async function processFailedExecutions(
  ctx: Context,
  failedExecutionsData: DecodedFailedHandlerExecution[],
): Promise<void> {
  const failedExecutions = new Set<Execution>();
  const transfers = new Set<Transfer>();
  for (const e of failedExecutionsData) {
    const failedExecution = new Execution({
      blockNumber: e.blockNumber.toString(),
      id: e.id,
      timestamp: e.timestamp,
      txHash: e.txHash,
    });

    const transfer = await getUpdatedTransfer(ctx, {
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

    failedExecutions.add(failedExecution);
    transfers.add(transfer);
  }

  await ctx.store.upsert([...failedExecutions.values()]);
  await ctx.store.upsert([...transfers.values()]);
}
