/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type { TransferStatus } from "../../model";

export interface ITransfers {
  page: number;
  limit: number;
  status?: TransferStatus;
}

export interface ITransferByTxHash {
  txHash: string;
  component: TransferComponent;
}

export interface ITransferBySender {
  sender: string;
}

enum TransferComponent {
  Deposit = "deposit",
  Execution = "execution",
}
