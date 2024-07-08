/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import { Account, Deposit, Execution, Fee, TransferStatus } from "../model";
import { Context } from "../evmProcessor";
import {
  DecodedDepositLog,
  DecodedFailedHandlerExecution,
  DecodedProposalExecutionLog,
} from "./evmTypes";
import { getUpdatedTransfer } from "./utils";

export async function processDeposits(
  ctx: Context,
  depositsData: DecodedDepositLog[]
): Promise<void> {
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

    await ctx.store.upsert(deposit);
    await ctx.store.upsert(transfer);
  }
}

export async function processExecutions(
  ctx: Context,
  executionsData: DecodedProposalExecutionLog[]
): Promise<void> {
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

    await ctx.store.upsert(execution);
    await ctx.store.upsert(transfer);
  }
}

export async function processFailedExecutions(
  ctx: Context,
  failedExecutionsData: DecodedFailedHandlerExecution[]
): Promise<void> {
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

    await ctx.store.upsert(failedExecution);
    await ctx.store.upsert(transfer);
  }
}
