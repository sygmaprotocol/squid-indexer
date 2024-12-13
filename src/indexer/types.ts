/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type { ConcreteAsset } from "./substrateIndexer/types/sygma-fee-handler-router/calls";

export type DecodedDepositLog = {
  id: string;
  blockNumber: number;
  depositNonce: string;
  sender: string;
  destination: string;
  routeID: string;
  txHash: string;
  timestamp: Date;
  depositData: string;
  handlerResponse: string;
  transferType: string;
  amount: string;
  senderStatus?: string;
};
export type DecodedRoutes = {
  destinationDomainID: string;
  resourceID: string;
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

export type DecodedFailedHandlerExecutionLog = {
  id: string;
  fromDomainID: string;
  toDomainID: string;
  depositNonce: string;
  message: string;
  txHash: string;
  blockNumber: number;
  timestamp: Date;
};

export type FeeCollectedData = {
  id: string;
  amount: string;
  tokenID: string;
  txIdentifier: string;
};

export type RouteData = {
  destinationDomainID: string;
  resourceID: string;
};

export type SubstrateRouteData = {
  args: { asset: ConcreteAsset; domainID: string };
};
export type DecodedEvents = {
  deposits: DecodedDepositLog[];
  executions: DecodedProposalExecutionLog[];
  failedHandlerExecutions: DecodedFailedHandlerExecutionLog[];
  fees: FeeCollectedData[];
  routes: DecodedRoutes[];
};
