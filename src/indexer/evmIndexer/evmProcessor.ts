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

import * as feeRouter from "../../abi/FeeHandlerRouterABI";
import * as bridge from "../../abi/bridge";
import type { Domain } from "../config";
import type { DecodedEvents, IParser, IProcessor } from "../indexer";
import type {
  DecodedDepositLog,
  DecodedFailedHandlerExecutionLog,
  DecodedProposalExecutionLog,
  DecodedRoutes,
  FeeCollectedData,
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
      .setBlockRange({ from: 241642 })
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
      })
      .addTransaction({
        to: [domain.feeRouter],
        sighash: [feeRouter.functions.adminSetResourceHandler.sighash],
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
    const routes: DecodedRoutes[] = [];
    const executions: DecodedProposalExecutionLog[] = [];
    const failedHandlerExecutions: DecodedFailedHandlerExecutionLog[] = [];
    const fees: FeeCollectedData[] = [];

    for (const block of ctx.blocks) {
      if (block.transactions.length) {
        for (const tx of block.transactions) {
          if (tx.to?.toLowerCase() == domain.feeRouter.toLowerCase()) {
            const route = await this.parser.parseEvmRoute!(tx.hash);
            if (route) {
              routes.push(route);
            }
          }
        }
      }

      for (const log of block.logs) {
        if (log.topics[0] === bridge.events.Deposit.topic) {
          const deposit = await this.parser.parseDeposit(log, domain, ctx);
          if (deposit) {
            deposits.push(deposit.decodedDepositLog);
            fees.push(deposit.decodedFeeLog);
          }
        } else if (log.topics[0] === bridge.events.ProposalExecution.topic) {
          const execution = await this.parser.parseProposalExecution(
            log,
            domain,
            ctx,
          );
          if (execution) {
            executions.push(execution);
          }
        } else if (
          log.topics[0] === bridge.events.FailedHandlerExecution.topic
        ) {
          const failedExecution = await this.parser.parseFailedHandlerExecution(
            log,
            domain,
            ctx,
          );
          if (failedExecution) {
            failedHandlerExecutions.push(failedExecution);
          }
        }
      }
    }
    return { deposits, executions, failedHandlerExecutions, fees, routes };
  }
}

export type Fields = EvmBatchProcessorFields<EvmBatchProcessor>;
export type Context = DataHandlerContext<Store, Fields>;
