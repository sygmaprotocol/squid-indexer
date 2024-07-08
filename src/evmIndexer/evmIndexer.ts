/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import {
  Account,
  Deposit,
  Execution,
  Fee,
  Transfer,
  TransferStatus,
} from "../model";
import { Context } from "../evmProcessor";
import {
  DecodedDepositLog,
  DecodedFailedHandlerExecution,
  DecodedProposalExecutionLog,
} from "./evmTypes";

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

    let transfer = await ctx.store.findOne(Transfer, {
      where: {
        depositNonce: d.depositNonce,
        toDomainID: d.toDomainID,
        fromDomainID: Number(d.fromDomainID),
      },
    });

    if (!transfer) {
      transfer = new Transfer({
        id: d.id,
        depositNonce: d.depositNonce,
        amount: d.amount,
        destination: d.destination,
        status: TransferStatus.pending,
        message: "",
        resourceID: d.resourceID,
        fromDomainID: Number(d.fromDomainID),
        toDomainID: d.toDomainID,
        account: account,
        deposit: deposit,
        fee: fee,
      });
    } else {
      (transfer.id = d.id),
        (transfer.depositNonce = d.depositNonce),
        (transfer.amount = d.amount),
        (transfer.destination = d.destination),
        (transfer.status = TransferStatus.pending),
        (transfer.message = ""),
        (transfer.resourceID = d.resourceID),
        (transfer.fromDomainID = Number(d.fromDomainID)),
        (transfer.toDomainID = d.toDomainID),
        (transfer.account = account),
        (transfer.deposit = deposit),
        (transfer.fee = fee);
    }
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

    let transfer = await ctx.store.findOne(Transfer, {
      where: {
        depositNonce: e.depositNonce,
        toDomainID: e.toDomainID,
        fromDomainID: Number(e.fromDomainID),
      },
    });

    if (!transfer) {
      transfer = new Transfer({
        id: e.id,
        depositNonce: e.depositNonce,
        amount: null,
        destination: null,
        status: TransferStatus.executed,
        message: "",
        fromDomainID: Number(e.fromDomainID),
        toDomainID: e.toDomainID,
        execution: execution,
      });
    } else {
      transfer.status = TransferStatus.executed;
    }
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

    let transfer = await ctx.store.findOne(Transfer, {
      where: {
        depositNonce: e.depositNonce,
        toDomainID: e.toDomainID,
        fromDomainID: e.fromDomainID,
      },
    });

    if (!transfer) {
      transfer = new Transfer({
        id: e.id,
        depositNonce: e.depositNonce,
        amount: null,
        destination: null,
        status: TransferStatus.failed,
        message: e.message,
        fromDomainID: Number(e.fromDomainID),
        toDomainID: e.toDomainID,
        execution: failedExecution,
      });
    } else {
      transfer.status = TransferStatus.failed;
      transfer.message = e.message;
    }
    await ctx.store.upsert(failedExecution);
    await ctx.store.upsert(transfer);
  }
}
