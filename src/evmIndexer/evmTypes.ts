/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/

export type DecodedLogs = {
  deposit: Array<DecodedDepositLog>
  proposalExecution: Array<DecodedProposalExecutionLog>
  errors: Array<DecodedFailedHandlerExecution>
}

export type DecodedDepositLog = {
  id: string, 
  blockNumber: number
  depositNonce: bigint
  toDomainID: number
  sender: string
  destination: string
  fromDomainID: number
  resourceID: string
  txHash: string
  timestamp: Date
  depositData: string
  handlerResponse: string
  transferType: string
  amount: string
  senderStatus?: string
  fee?: FeeData 
}

  export type DecodedProposalExecutionLog = {
    id: string, 
    blockNumber: number
    from: string
    depositNonce: bigint
    txHash: string
    timestamp: Date
    fromDomainID: number
    toDomainID: number,
  }

  export type DecodedFailedHandlerExecution = {
    id: string, 
    fromDomainID: number
    toDomainID: number
    depositNonce: bigint
    message: string
    txHash: string
    blockNumber: number
    timestamp: Date
  }

  export type FeeData = {
    tokenAddress: string
    tokenSymbol: string
    amount: string
    decimals: number
  }
  
export enum EventType {
  DEPOSIT = "Deposit",
  PROPOSAL_EXECUTION = "ProposalExecution",
  FAILED_HANDLER_EXECUTION = "FailedHandlerExecution",
  FEE_COLLECTED = "FeeCollected",
}
  
export enum FeeHandlerType {
  BASIC = "basic",
  PERCENTAGE = "percentage",
}

export enum DepositType {
  FUNGIBLE = "fungible",
  NONFUNGIBLE = "nonfungible",
  SEMIFUNGIBLE = "semifungible",
  PERMISSIONLESS_GENERIC = "permissionlessGeneric",
  PERMISSIONED_GENERIC = "permissionedGeneric",
}

