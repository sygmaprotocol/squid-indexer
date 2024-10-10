/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import { randomUUID } from "crypto";

import { assertNotNull } from "@subsquid/substrate-processor";

import type { Domain, SubstrateResource } from "../../config";
import { generateTransferID } from "../../utils";
import type {
  DecodedDepositLog,
  DecodedFailedHandlerExecution,
  DecodedProposalExecutionLog,
  FeeCollectedData,
} from "../../utils/types";
import type { Event } from "../substrateProcessor";
import { events } from "../types";

import { getDecodedAmount } from "./helpers";

export function parseSubstrateDeposit(
  event: Event,
  fromDomain: Domain,
): DecodedDepositLog {
  const decodedEvent = events.sygmaBridge.deposit.v1250.decode(event);
  const resource = fromDomain.resources.find(
    (resource) => resource.resourceId == decodedEvent.resourceId,
  );
  if (!resource) {
    throw new Error(
      `Resource with ID ${decodedEvent.resourceId} not found in shared configuration`,
    );
  }

  const resourceType = resource.type || "";

  const extrinsic = assertNotNull(event.extrinsic, "Missing extrinsic");
  return {
    id: generateTransferID(
      decodedEvent.depositNonce.toString(),
      fromDomain.id.toString(),
      decodedEvent.destDomainId.toString(),
    ),
    blockNumber: event.block.height,
    depositNonce: decodedEvent.depositNonce,
    toDomainID: decodedEvent.destDomainId,
    sender: decodedEvent.sender,
    destination: `0x${decodedEvent.depositData.substring(2).slice(128, decodedEvent.depositData.length - 1)}`,
    fromDomainID: fromDomain.id,
    resourceID: resource.resourceId,
    txHash: extrinsic.hash,
    timestamp: new Date(event.block.timestamp || ""),
    depositData: decodedEvent.depositData,
    handlerResponse: decodedEvent.handlerResponse,
    transferType: resourceType,
    amount: getDecodedAmount(decodedEvent.depositData),
  };
}

export function parseSubstrateProposalExecution(
  event: Event,
  toDomainID: number,
): DecodedProposalExecutionLog {
  const decodedEvent = events.sygmaBridge.proposalExecution.v1250.decode(event);
  const extrinsic = assertNotNull(event.extrinsic, "Missing extrinsic");

  return {
    id: generateTransferID(
      decodedEvent.depositNonce.toString(),
      decodedEvent.originDomainId.toString(),
      toDomainID.toString(),
    ),
    blockNumber: event.block.height,
    depositNonce: decodedEvent.depositNonce,
    txHash: extrinsic.hash,
    timestamp: new Date(event.block.timestamp || ""),
    fromDomainID: decodedEvent.originDomainId,
    toDomainID: toDomainID,
  };
}

export function parseSubstrateFailedHandlerExecution(
  event: Event,
  toDomainID: number,
): DecodedFailedHandlerExecution {
  const decodedEvent =
    events.sygmaBridge.failedHandlerExecution.v1250.decode(event);
  const extrinsic = assertNotNull(event.extrinsic, "Missing extrinsic");

  return {
    id: generateTransferID(
      decodedEvent.depositNonce.toString(),
      decodedEvent.originDomainId.toString(),
      toDomainID.toString(),
    ),
    fromDomainID: decodedEvent.originDomainId,
    toDomainID: toDomainID,
    depositNonce: decodedEvent.depositNonce,
    txHash: extrinsic.hash,
    message: decodedEvent.error,
    blockNumber: event.block.height,
    timestamp: new Date(event.block.timestamp!),
  };
}

export function parseFee(
  event: Event,
  substrateResources: SubstrateResource[],
): FeeCollectedData {
  const decodedEvent = events.sygmaBridge.feeCollected.v1260.decode(event);
  const resource = substrateResources.find(
    (resource) => resource.resourceId == decodedEvent.resourceId,
  );
  if (!resource) {
    throw new Error(
      `Resource with ID ${decodedEvent.resourceId} not found in shared configuration`,
    );
  }

  const txIdentifier = `${event.block.height}-${event.extrinsic?.index}`;

  return {
    id: randomUUID(),
    amount: decodedEvent.feeAmount.toString().replace(/,/g, ""),
    decimals: resource.decimals,
    tokenAddress: JSON.stringify(decodedEvent.feeAssetId),
    tokenSymbol: resource.symbol,
    txIdentifier: txIdentifier,
  };
}
