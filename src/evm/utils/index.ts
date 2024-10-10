/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/

import type { ApiPromise } from "@polkadot/api";
import type {} from "@polkadot/types/interfaces";
import { assertNotNull } from "@subsquid/evm-processor";
import type { Provider } from "ethers";
import { ethers } from "ethers";

import * as bridge from "../../abi/bridge";
import type { Domain } from "../../config";
import { generateTransferID } from "../../utils";
import type {
  DecodedDepositLog,
  DecodedFailedHandlerExecution,
  DecodedProposalExecutionLog,
} from "../../utils/types";
import type { Log } from "../evmProcessor";

import { decodeAmountsOrTokenId, getFee, parseDestination } from "./helpers";

export async function parseDeposit(
  log: Log,
  fromDomain: Domain,
  toDomain: Domain,
  provider: Provider,
  substrateRpcUrlConfig: Map<number, ApiPromise>,
): Promise<DecodedDepositLog> {
  const event = bridge.events.Deposit.decode(log);
  const resource = fromDomain.resources.find(
    (resource) => resource.resourceId == event.resourceID,
  );
  if (!resource) {
    throw new Error(
      `Resource with ID ${event.resourceID} not found in shared configuration`,
    );
  }
  const resourceType = resource.type || "";
  const resourceDecimals = resource.decimals || 18;

  const transaction = assertNotNull(log.transaction, "Missing transaction");

  return {
    id: generateTransferID(
      event.depositNonce.toString(),
      fromDomain.id.toString(),
      event.destinationDomainID.toString(),
    ),
    blockNumber: log.block.height,
    depositNonce: event.depositNonce,
    toDomainID: event.destinationDomainID,
    sender: transaction.from,
    destination: parseDestination(
      event.data,
      toDomain,
      resourceType,
      substrateRpcUrlConfig,
    ),
    fromDomainID: fromDomain.id,
    resourceID: resource.resourceId,
    txHash: transaction.hash,
    timestamp: new Date(log.block.timestamp),
    depositData: event.data,
    handlerResponse: event.handlerResponse,
    transferType: resourceType,
    amount: decodeAmountsOrTokenId(
      event.data,
      resourceDecimals,
      resourceType,
    ) as string,
    fee: await getFee(event, fromDomain, provider),
  };
}

export function parseProposalExecution(
  log: Log,
  toDomain: Domain,
): DecodedProposalExecutionLog {
  const event = bridge.events.ProposalExecution.decode(log);
  const transaction = assertNotNull(log.transaction, "Missing transaction");

  return {
    id: generateTransferID(
      event.depositNonce.toString(),
      event.originDomainID.toString(),
      toDomain.id.toString(),
    ),
    blockNumber: log.block.height,
    depositNonce: event.depositNonce,
    txHash: transaction.hash,
    timestamp: new Date(log.block.timestamp),
    fromDomainID: event.originDomainID,
    toDomainID: toDomain.id,
  };
}

export function parseFailedHandlerExecution(
  log: Log,
  toDomain: Domain,
): DecodedFailedHandlerExecution {
  const event = bridge.events.FailedHandlerExecution.decode(log);
  const transaction = assertNotNull(log.transaction, "Missing transaction");

  return {
    id: generateTransferID(
      event.depositNonce.toString(),
      event.originDomainID.toString(),
      toDomain.id.toString(),
    ),
    fromDomainID: event.originDomainID,
    toDomainID: toDomain.id,
    depositNonce: event.depositNonce,
    txHash: transaction.hash,
    message: ethers.decodeBytes32String(
      "0x" + Buffer.from(event.lowLevelData).subarray(-64).toString(),
    ),
    blockNumber: log.block.height,
    timestamp: new Date(log.block.timestamp),
  };
}
