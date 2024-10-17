/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type { TransferStatus } from "../../../model";
import type { DomainType } from "../../services/transfers.service";

export interface ITransfer {
  page: number;
  limit: number;
  status?: TransferStatus;
}

export interface ITransferById {
  id: string;
}

export interface ITransferByTxHash {
  txHash: string;
}

export interface ITransferBySender extends ITransfer {
  senderAddress: string;
}

export interface ITransferByResource extends ITransfer {
  resourceID: string;
}

export interface ITransferBySourceDomainToDestinationDomain extends ITransfer {
  sourceDomainID: number;
  destinationDomainID: number;
}

export interface ITransferByResourceBetweenDomains
  extends ITransfer,
    ITransferByResource,
    ITransferBySourceDomainToDestinationDomain {}

export interface ITransferByDomain extends ITransfer {
  domainID: number;
}

export interface ITransferByDomainQuery extends ITransfer {
  domain: DomainType;
}

export type IncludedQueryParams = {
  resource: {
    type: boolean;
    id: boolean;
  };
  toDomain: {
    name: boolean;
    lastIndexedBlock: boolean;
    id: boolean;
  };
  fromDomain: {
    name: boolean;
    lastIndexedBlock: boolean;
    id: boolean;
  };
  fee: {
    id: boolean;
    amount: boolean;
    tokenAddress: boolean;
    tokenSymbol: boolean;
    decimals: boolean;
  };
  deposit: {
    txHash: boolean;
    blockNumber: boolean;
    depositData: boolean;
    handlerResponse: boolean;
    timestamp: boolean;
  };
  execution: {
    txHash: boolean;
    blockNumber: boolean;
    timestamp: boolean;
  };
  account: {
    id: boolean;
    addressStatus: boolean;
  };
};
