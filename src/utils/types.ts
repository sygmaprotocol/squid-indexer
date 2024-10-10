/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/

export type DecodedDepositLog = {
  id: string;
  blockNumber: number;
  depositNonce: bigint;
  toDomainID: number;
  sender: string;
  destination: string;
  fromDomainID: number;
  resourceID: string;
  txHash: string;
  timestamp: Date;
  depositData: string;
  handlerResponse: string;
  transferType: string;
  amount: string;
  senderStatus?: string;
  fee?: FeeData;
};

export type DecodedProposalExecutionLog = {
  id: string;
  blockNumber: number;
  depositNonce: bigint;
  txHash: string;
  timestamp: Date;
  fromDomainID: number;
  toDomainID: number;
};

export type DecodedFailedHandlerExecution = {
  id: string;
  fromDomainID: number;
  toDomainID: number;
  depositNonce: bigint;
  message: string;
  txHash: string;
  blockNumber: number;
  timestamp: Date;
};

export type FeeData = {
  id: string;
  tokenAddress: string;
  tokenSymbol: string;
  amount: string;
  decimals: number;
};

export type FeeCollectedData = FeeData & {
  txIdentifier: string;
};
