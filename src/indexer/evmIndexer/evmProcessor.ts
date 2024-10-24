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

import * as bridge from "../../abi/bridge";
import type { Domain } from "../config";
import type { DecodedEvents, IParser, IProcessor } from "../indexer";
import type {
  DecodedDepositLog,
  DecodedFailedHandlerExecution,
  DecodedProposalExecutionLog,
} from "../types";

export class EVMProcessor implements IProcessor {
  private parser: IParser;
  private rpcUrl: string;
  constructor(parser: IParser, rpcUrl: string) {
    this.parser = parser;
    this.rpcUrl = rpcUrl;
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

    if (process.env.DOMAIN_GATEWAY) {
      evmProcessor.setGateway(process.env.DOMAIN_GATEWAY);
    }
    return evmProcessor;
  }

  public async processEvents(
    ctx: Context,
    domain: Domain,
  ): Promise<DecodedEvents> {
    const deposits: DecodedDepositLog[] = [];
    const executions: DecodedProposalExecutionLog[] = [];
    const failedHandlerExecutions: DecodedFailedHandlerExecution[] = [];
    for (const block of ctx.blocks) {
      for (const log of block.logs) {
        if (log.topics[0] === bridge.events.Deposit.topic) {
          deposits.push(await this.parser.parseDeposit(log, domain));
        } else if (log.topics[0] === bridge.events.ProposalExecution.topic) {
          executions.push(this.parser.parseProposalExecution(log, domain));
        } else if (
          log.topics[0] === bridge.events.FailedHandlerExecution.topic
        ) {
          failedHandlerExecutions.push(
            this.parser.parseFailedHandlerExecution(log, domain),
          );
        }
      }
    }
    return { deposits, executions, failedHandlerExecutions, fees: [] };
  }
}

export type Fields = EvmBatchProcessorFields<EvmBatchProcessor>;
export type Context = DataHandlerContext<Store, Fields>;
