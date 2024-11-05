/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/

export type DepositEvent = {
  destinationDomainID: number;
  resourceID: string;
  depositNonce: bigint;
  data: string;
};
export type DecodedDepositLog = {
  id: string;
  blockNumber: number;
  depositNonce: string;
  toDomainID: string;
  sender: string;
  destination: string;
  fromDomainID: string;
  resourceID: string;
  txHash: string;
  timestamp: Date;
  depositData: string;
  handlerResponse: string;
  transferType: string;
  amount: string;
  senderStatus?: string;
  fee: FeeData;
};

export type DecodedProposalExecutionLog = {
  id: string;
  blockNumber: number;
  depositNonce: string;
  txHash: string;
  timestamp: Date;
  fromDomainID: string;
  toDomainID: string;
};

export type DecodedFailedHandlerExecution = {
  id: string;
  fromDomainID: string;
  toDomainID: string;
  depositNonce: string;
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
