/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type {
  DataHandlerContext,
  FieldSelection,
  SubstrateBatchProcessorFields,
  Event as _Event,
} from "@subsquid/substrate-processor";
import { SubstrateBatchProcessor } from "@subsquid/substrate-processor";
import type { Store } from "@subsquid/typeorm-store";
import type winston from "winston";

import { NotFoundError } from "../../utils/error";
import type { Domain } from "../config";
import type { IProcessor } from "../indexer";
import type {
  DecodedDepositLog,
  DecodedEvents,
  DecodedFailedHandlerExecutionLog,
  DecodedProposalExecutionLog,
  FeeCollectedData,
} from "../types";

import type { ISubstrateParser } from "./substrateParser";
import { events } from "./types";

export class SubstrateProcessor implements IProcessor {
  private parser: ISubstrateParser;
  private rpcUrl: string;
  private fieldSelection: FieldSelection;
  private logger: winston.Logger;
  constructor(
    parser: ISubstrateParser,
    rpcUrl: string,
    logger: winston.Logger,
  ) {
    this.parser = parser;
    this.rpcUrl = rpcUrl;
    this.fieldSelection = {
      extrinsic: { hash: true },
      block: { timestamp: true },
    };
    this.logger = logger;
  }

  public getProcessor(domain: Domain): SubstrateBatchProcessor<Fields> {
    const substrateProcessor = new SubstrateBatchProcessor()
      .setRpcEndpoint({
        url: this.rpcUrl,
        rateLimit: 10,
      })
      .setBlockRange({ from: domain.startBlock })
      .setFinalityConfirmation(domain.blockConfirmations)
      .addEvent({
        name: [events.sygmaBridge.deposit.name],
        extrinsic: true,
      })
      .addEvent({
        name: [events.sygmaBridge.proposalExecution.name],
        extrinsic: true,
      })
      .addEvent({
        name: [events.sygmaBridge.failedHandlerExecution.name],
        extrinsic: true,
      })
      .addEvent({
        name: [events.sygmaBridge.feeCollected.name],
        extrinsic: true,
      })
      .setFields(this.fieldSelection);

    if (domain.gateway) {
      substrateProcessor.setGateway(domain.gateway);
    }
    return substrateProcessor;
  }

  public async processEvents(
    ctx: Context,
    domain: Domain,
  ): Promise<DecodedEvents> {
    const deposits: DecodedDepositLog[] = [];
    const executions: DecodedProposalExecutionLog[] = [];
    const failedHandlerExecutions: DecodedFailedHandlerExecutionLog[] = [];
    const fees: FeeCollectedData[] = [];
    for (const block of ctx.blocks) {
      this.logger.info(
        `processing bloc ${block.header.height} on networ ${domain.name}(${domain.id})`,
      );
      for (const event of block.events) {
        try {
          switch (event.name) {
            case events.sygmaBridge.deposit.name: {
              const deposit = await this.parser.parseDeposit(
                event,
                domain,
                ctx,
              );
              deposits.push(deposit.decodedDepositLog);
              fees.push(deposit.decodedFeeLog);
              break;
            }

            case events.sygmaBridge.proposalExecution.name: {
              const execution = await this.parser.parseProposalExecution(
                event,
                domain,
                ctx,
              );
              executions.push(execution);
              break;
            }

            case events.sygmaBridge.failedHandlerExecution.name: {
              const failedExecution =
                await this.parser.parseFailedHandlerExecution(
                  event,
                  domain,
                  ctx,
                );
              failedHandlerExecutions.push(failedExecution);
              break;
            }

            case events.sygmaBridge.feeCollected.name: {
              const feeCollected = await this.parser.parseFee(
                event,
                domain,
                ctx,
              );
              // filter out default fees
              fees.filter(
                (fee) => fee.txIdentifier === feeCollected.txIdentifier,
              );
              fees.push(feeCollected);
              break;
            }

            default:
              this.logger.error(`Unsupported log topic: ${event.name}`);
              break;
          }
        } catch (error) {
          if (error instanceof NotFoundError) {
            this.logger.error(error.message);
          } else {
            throw error;
          }
        }
      }
    }
    return { deposits, executions, failedHandlerExecutions, fees };
  }
}

export type Fields = SubstrateBatchProcessorFields<typeof SubstrateProcessor>;
export type Event = _Event<Fields>;
export type Context = DataHandlerContext<Store, Fields>;
