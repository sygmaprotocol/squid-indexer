/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type {
  DataHandlerContext,
  EvmBatchProcessorFields,
} from "@subsquid/evm-processor";
import { EvmBatchProcessor } from "@subsquid/evm-processor";
import type { Store } from "@subsquid/typeorm-store";
import type winston from "winston";

import * as bridge from "../../abi/bridge";
import { NotFoundError } from "../../utils/error";
import type { Domain } from "../config";
import type { IParser, IProcessor } from "../indexer";
import type {
  DecodedDepositLog,
  DecodedEvents,
  DecodedFailedHandlerExecutionLog,
  DecodedProposalExecutionLog,
  FeeCollectedData,
} from "../types";

export class EVMProcessor implements IProcessor {
  private parser: IParser;
  private rpcUrl: string;
  private logger: winston.Logger;
  constructor(parser: IParser, rpcUrl: string, logger: winston.Logger) {
    this.parser = parser;
    this.rpcUrl = rpcUrl;
    this.logger = logger;
  }
  public getProcessor(domain: Domain): EvmBatchProcessor {
    const evmProcessor = new EvmBatchProcessor()
      .setRpcEndpoint({
        url: this.rpcUrl,
        rateLimit: 10,
      })
      .setBlockRange({ from: domain.startBlock })
      .setFinalityConfirmation(domain.blockConfirmations)
      .addLog({
        address: [domain.bridge],
        topic0: [bridge.events.ProposalExecution.topic],
        transaction: true,
      })
      .addLog({
        address: [domain.bridge],
        topic0: [bridge.events.Deposit.topic],
        transaction: true,
      })
      .addLog({
        address: [domain.bridge],
        topic0: [bridge.events.FailedHandlerExecution.topic],
        transaction: true,
      });

    if (domain.gateway) {
      evmProcessor.setGateway(domain.gateway);
    }
    return evmProcessor;
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
        `Processing block ${block.header.height} on networ ${domain.name}(${domain.id})`,
      );
      for (const log of block.logs) {
        try {
          switch (log.topics[0]) {
            case bridge.events.Deposit.topic: {
              const deposit = await this.parser.parseDeposit(log, domain, ctx);
              deposits.push(deposit.decodedDepositLog);
              fees.push(deposit.decodedFeeLog);
              break;
            }

            case bridge.events.ProposalExecution.topic: {
              const execution = await this.parser.parseProposalExecution(
                log,
                domain,
                ctx,
              );
              executions.push(execution);
              break;
            }

            case bridge.events.FailedHandlerExecution.topic: {
              const failedExecution =
                await this.parser.parseFailedHandlerExecution(log, domain, ctx);
              failedHandlerExecutions.push(failedExecution);
              break;
            }

            default:
              this.logger.error(`Unsupported log topic: ${log.topics[0]}`);
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

export type Fields = EvmBatchProcessorFields<EvmBatchProcessor>;
export type Context = DataHandlerContext<Store, Fields>;
