/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/

import { randomUUID } from "crypto";

import { ResourceType } from "@buildwithsygma/core";
import type { ApiPromise } from "@polkadot/api";
import type { MultiLocation } from "@polkadot/types/interfaces";
import { decodeHex } from "@subsquid/evm-processor";
import { assertNotNull } from "@subsquid/substrate-processor";

import { decodeAmountOrTokenId, generateTransferID } from "../../indexer/utils";
import { Domain, Resource } from "../../model";
import { logger } from "../../utils/logger";
import type { Domain as DomainType } from "../config";
import type { IParser } from "../indexer";
import type { Event } from "../substrateIndexer/substrateProcessor";
import type {
  DecodedDepositLog,
  DecodedProposalExecutionLog,
  DecodedFailedHandlerExecutionLog,
  FeeCollectedData,
} from "../types";

import type { Context } from "./substrateProcessor";
import { events } from "./types";
import type { sygmaFeeHandlerRouter } from "./types/calls";

export interface ISubstrateParser extends IParser {
  parseFee(
    log: Event,
    fromDomain: DomainType,
    ctx: Context,
  ): Promise<FeeCollectedData | null>;
}

export class SubstrateParser implements ISubstrateParser {
  private provider: ApiPromise;
  private parsers!: Map<number, IParser>;

  constructor(provider: ApiPromise) {
    this.provider = provider;
  }

  public setParsers(parsers: Map<number, IParser>): void {
    this.parsers = parsers;
  }

  public async parseDeposit(
    log: Event,
    fromDomain: DomainType,
    ctx: Context,
  ): Promise<{
    decodedDepositLog: DecodedDepositLog;
    decodedFeeLog: FeeCollectedData;
  } | null> {
    const event = events.sygmaBridge.deposit.v1250.decode(log);
    const destinationParser = this.parsers.get(event.destDomainId);
    if (!destinationParser) {
      logger.error(`Destination domain id ${event.destDomainId} not supported`);
      return null;
    }
    const resource = await ctx.store.findOne(Resource, {
      where: {
        resourceID: event.resourceId.toLowerCase(),
        domainID: fromDomain.id.toString(),
      },
    });
    if (!resource) {
      logger.error(`Unsupported resource: ${event.resourceId.toLowerCase()}`);
      return null;
    }

    const resourceType = resource.type ?? "";

    const extrinsic = assertNotNull(log.extrinsic, "Missing extrinsic");

    return {
      decodedDepositLog: {
        id: generateTransferID(
          event.depositNonce.toString(),
          fromDomain.id.toString(),
          event.destDomainId.toString(),
        ),
        blockNumber: log.block.height,
        depositNonce: event.depositNonce.toString(),
        toDomainID: event.destDomainId.toString(),
        sender: event.sender,
        destination: destinationParser.parseDestination(
          event.depositData,
          resourceType as ResourceType,
        ),
        fromDomainID: fromDomain.id.toString(),
        resourceID: resource.id,
        txHash: extrinsic.id,
        timestamp: new Date(log.block.timestamp ?? ""),
        depositData: event.depositData,
        handlerResponse: event.handlerResponse,
        transferType: resourceType,
        amount: decodeAmountOrTokenId(
          event.depositData,
          resource.decimals ?? 12,
          resource.type as ResourceType,
        ),
      },
      decodedFeeLog: {
        id: randomUUID(),
        amount: "50",
        domainID: fromDomain.id.toString(),
        resourceID: resource.id,
        txIdentifier: extrinsic.id,
      },
    };
  }

  public async parseProposalExecution(
    log: Event,
    toDomain: DomainType,
    ctx: Context,
  ): Promise<DecodedProposalExecutionLog | null> {
    const event = events.sygmaBridge.proposalExecution.v1250.decode(log);
    const extrinsic = assertNotNull(log.extrinsic, "Missing extrinsic");

    const fromDomain = await ctx.store.findOne(Domain, {
      where: { id: event.originDomainId.toString() },
    });

    if (!fromDomain) {
      logger.error(`Source domain id ${event.originDomainId} not supported`);
      return null;
    }
    return {
      id: generateTransferID(
        event.depositNonce.toString(),
        event.originDomainId.toString(),
        toDomain.id.toString(),
      ),
      blockNumber: log.block.height,
      depositNonce: event.depositNonce.toString(),
      txHash: extrinsic.id,
      timestamp: new Date(log.block.timestamp ?? ""),
      fromDomainID: event.originDomainId.toString(),
      toDomainID: toDomain.id.toString(),
    };
  }

  public async parseFailedHandlerExecution(
    log: Event,
    toDomain: DomainType,
    ctx: Context,
  ): Promise<DecodedFailedHandlerExecutionLog | null> {
    const event = events.sygmaBridge.failedHandlerExecution.v1250.decode(log);
    const extrinsic = assertNotNull(log.extrinsic, "Missing extrinsic");
    const fromDomain = await ctx.store.findOne(Domain, {
      where: { id: event.originDomainId.toString() },
    });
    if (!fromDomain) {
      logger.error(`Source domain id ${event.originDomainId} not supported`);
      return null;
    }
    return {
      id: generateTransferID(
        event.depositNonce.toString(),
        event.originDomainId.toString(),
        toDomain.id.toString(),
      ),
      fromDomainID: event.originDomainId.toString(),
      toDomainID: toDomain.id.toString(),
      depositNonce: event.depositNonce.toString(),
      txHash: extrinsic.id,
      message: event.error,
      blockNumber: log.block.height,
      timestamp: new Date(log.block.timestamp!),
    };
  }

  public parseSubstrateAsset(call: sygmaFeeHandlerRouter.Call): string {
    const asset = call.args.asset;
    if (asset.__kind === "Concrete" && asset.value) {
      const assetValue = asset.value;

      if (assetValue.interior && assetValue.interior.__kind === "Here") {
        const decodedAsset = {
          concrete: {
            parents: assetValue.parents,
            interior: assetValue.interior.__kind.toLowerCase(),
          },
        };

        return JSON.stringify(decodedAsset);
      }
    }
    return "";
  }

  public async parseFee(
    log: Event,
    fromDomain: DomainType,
    ctx: Context,
  ): Promise<FeeCollectedData | null> {
    const event = events.sygmaBridge.feeCollected.v1260.decode(log);
    const resource = await ctx.store.findOne(Resource, {
      where: {
        resourceID: event.resourceId.toLowerCase(),
        domainID: fromDomain.id.toString(),
      },
    });
    if (!resource) {
      logger.error(`Unsupported resource: ${event.resourceId.toLowerCase()}`);
      return null;
    }

    const extrinsic = assertNotNull(log.extrinsic, "Missing extrinsic");

    return {
      id: randomUUID(),
      amount: event.feeAmount.toString().replaceAll(",", ""),
      domainID: fromDomain.id.toString(),
      resourceID: resource.id,
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
}
