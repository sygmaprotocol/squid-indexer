/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type { TransferStatus } from "../../model";

export interface ITransfer {
  page: number;
  limit: number;
  status?: TransferStatus;
}

export interface ITransferByTxHash {
  txHash: string;
}

export interface ITransferBySender extends ITransfer {
  senderAddress: string;
}

export interface ITransferByDomain extends ITransfer {
  domainID: number;
}

export enum TransferType {
  Deposit = "deposit",
  Execution = "execution",
}

export interface ITransferByTransferType extends ITransfer {
  type: TransferType;
}
