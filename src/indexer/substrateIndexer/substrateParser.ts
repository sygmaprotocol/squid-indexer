/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/

import { randomUUID } from "crypto";

import type { SubstrateResource } from "@buildwithsygma/sygma-sdk-core";
import { ResourceType } from "@buildwithsygma/sygma-sdk-core";
import type { BigNumber } from "@ethersproject/bignumber";
import { ApiPromise, WsProvider } from "@polkadot/api";
import type { MultiLocation } from "@polkadot/types/interfaces";
import { decodeHex } from "@subsquid/evm-processor";
import { assertNotNull } from "@subsquid/substrate-processor";
import { AbiCoder, formatEther } from "ethers";

import { generateTransferID } from "../../utils";
import { logger } from "../../utils/logger";
import type { Domain } from "../config";
import type { IParser } from "../indexer";
import type { Event } from "../substrateIndexer/substrateProcessor";
import type {
  DecodedDepositLog,
  DecodedProposalExecutionLog,
  DecodedFailedHandlerExecution,
  FeeCollectedData,
} from "../types";

import { events } from "./types";

export interface ISubstrateParser extends IParser {
  parseFee(log: Event, fromDomain: Domain): FeeCollectedData;
}

export class SubstrateParser implements ISubstrateParser {
  private rpcUrl: string;
  private provider!: ApiPromise;
  private parsers!: Map<number, IParser>;

  constructor(rpcUrl: string) {
    this.rpcUrl = rpcUrl;
  }

  public async init(parsers: Map<number, IParser>): Promise<void> {
    this.parsers = parsers;

    const wsProvider = new WsProvider(this.rpcUrl);
    const api = await ApiPromise.create({
      provider: wsProvider,
    });
    this.provider = api;
  }

  public parseDeposit(event: Event, fromDomain: Domain): DecodedDepositLog {
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
      txHash: extrinsic.id,
      timestamp: new Date(event.block.timestamp || ""),
      depositData: decodedEvent.depositData,
      handlerResponse: decodedEvent.handlerResponse,
      transferType: resourceType,
      amount: this.getDecodedAmount(decodedEvent.depositData),
    };
  }

  public parseProposalExecution(
    event: Event,
    toDomain: Domain,
  ): DecodedProposalExecutionLog {
    const decodedEvent =
      events.sygmaBridge.proposalExecution.v1250.decode(event);
    const extrinsic = assertNotNull(event.extrinsic, "Missing extrinsic");

    return {
      id: generateTransferID(
        decodedEvent.depositNonce.toString(),
        decodedEvent.originDomainId.toString(),
        toDomain.id.toString(),
      ),
      blockNumber: event.block.height,
      depositNonce: decodedEvent.depositNonce,
      txHash: extrinsic.id,
      timestamp: new Date(event.block.timestamp || ""),
      fromDomainID: decodedEvent.originDomainId,
      toDomainID: toDomain.id,
    };
  }
  public parseFailedHandlerExecution(
    event: Event,
    toDomain: Domain,
  ): DecodedFailedHandlerExecution {
    const decodedEvent =
      events.sygmaBridge.failedHandlerExecution.v1250.decode(event);
    const extrinsic = assertNotNull(event.extrinsic, "Missing extrinsic");

    return {
      id: generateTransferID(
        decodedEvent.depositNonce.toString(),
        decodedEvent.originDomainId.toString(),
        toDomain.id.toString(),
      ),
      fromDomainID: decodedEvent.originDomainId,
      toDomainID: toDomain.id,
      depositNonce: decodedEvent.depositNonce,
      txHash: extrinsic.id,
      message: decodedEvent.error,
      blockNumber: event.block.height,
      timestamp: new Date(event.block.timestamp!),
    };
  }

  public parseFee(log: Event, fromDomain: Domain): FeeCollectedData {
    const decodedEvent = events.sygmaBridge.feeCollected.v1260.decode(log);
    const resource = fromDomain.resources.find(
      (resource) => resource.resourceId == decodedEvent.resourceId,
    ) as SubstrateResource;
    if (!resource) {
      throw new Error(
        `Resource with ID ${decodedEvent.resourceId} not found in shared configuration`,
      );
    }

    const extrinsic = assertNotNull(log.extrinsic, "Missing extrinsic");

    return {
      id: randomUUID(),
      amount: decodedEvent.feeAmount.toString().replace(/,/g, ""),
      decimals: resource.decimals || 0,
      tokenAddress: JSON.stringify(decodedEvent.feeAssetId),
      tokenSymbol: resource.assetName,
      txIdentifier: extrinsic.id,
    };
  }

  public parseDestination(hexData: string, resourceType: ResourceType): string {
    const arrayifyData = decodeHex(hexData);
    let recipient = "";
    switch (resourceType) {
      case ResourceType.FUNGIBLE:
      case ResourceType.NON_FUNGIBLE: {
        const recipientlen = Number(
          "0x" + arrayifyData.subarray(32, 64).toString("hex"),
        );
        recipient =
          "0x" + arrayifyData.subarray(64, 64 + recipientlen).toString("hex");
        break;
      }
      case ResourceType.PERMISSIONLESS_GENERIC:
        {
          // 32 + 2 + 1 + 1 + 20 + 20
          const lenExecuteFuncSignature = Number(
            "0x" + arrayifyData.subarray(32, 34).toString("hex"),
          );
          const lenExecuteContractAddress = Number(
            "0x" +
              arrayifyData
                .subarray(
                  34 + lenExecuteFuncSignature,
                  35 + lenExecuteFuncSignature,
                )
                .toString("hex"),
          );
          recipient =
            "0x" +
            arrayifyData
              .subarray(
                35 + lenExecuteFuncSignature,
                35 + lenExecuteFuncSignature + lenExecuteContractAddress,
              )
              .toString("hex");
        }
        break;
      default:
        logger.error(`Unsupported resource type: ${resourceType}`);
        return "";
    }
    const decodedData = this.provider.createType<MultiLocation>(
      "MultiLocation",
      recipient,
    );

    const junction = decodedData.interior;
    if (junction.isX1) {
      if (junction.asX1.isAccountId32) {
        return junction.asX1.asAccountId32.id.toString();
      }
    }
    return "";
  }

  private getDecodedAmount(depositData: string): string {
    const abiCoder = AbiCoder.defaultAbiCoder();
    const parsedAmount = `0x${depositData.substring(2).slice(0, 64)}`;
    const decodedDepositData = abiCoder.decode(["uint256"], parsedAmount);
    return formatEther((decodedDepositData[0] as BigNumber).toString());
  }
}
