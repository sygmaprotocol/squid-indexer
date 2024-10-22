/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type {
  BlockHeader,
  DataHandlerContext,
  EvmBatchProcessorFields,
  Log as _Log,
  Transaction as _Transaction,
  EvmBatchProcessor,
} from "@subsquid/evm-processor";
import type { Store } from "@subsquid/typeorm-store";
import { TypeormDatabase } from "@subsquid/typeorm-store";

import * as bridge from "../abi/bridge";

import type { Domain, DomainConfig } from "./config";
import type {
  DecodedDepositLog,
  DecodedFailedHandlerExecution,
  DecodedProposalExecutionLog,
} from "./types";

export interface IParser {
  parseDeposit(
    log: Log,
    fromDomain: Domain,
    domainConfigMap: Map<number, DomainConfig>,
  ): Promise<DecodedDepositLog>;
  parseProposalExecution(
    log: Log,
    toDomain: Domain,
  ): DecodedProposalExecutionLog;
  parseFailedHandlerExecution(
    log: Log,
    toDomain: Domain,
  ): DecodedFailedHandlerExecution;
}

export interface IProcessor {
  getProcessor(rpcUrls: Map<number, string>, domain: Domain): EvmBatchProcessor;
  processDeposits(
    ctx: Context,
    failedExecutionsData: DecodedDepositLog[],
  ): Promise<void>;

  processExecutions(
    ctx: Context,
    failedExecutionsData: DecodedProposalExecutionLog[],
  ): Promise<void>;

  processFailedExecutions(
    ctx: Context,
    failedExecutionsData: DecodedFailedHandlerExecution[],
  ): Promise<void>;
}

export class Indexer {
  private domainID: number;
  private rpcUrls: Map<number, string>;
  private domainConfigMap: Map<number, DomainConfig>;

  constructor(
    domainID: number,
    rpcUrls: Map<number, string>,
    domainConfigMap: Map<number, DomainConfig>,
  ) {
    this.domainID = domainID;
    this.rpcUrls = rpcUrls;
    this.domainConfigMap = domainConfigMap;
  }
  public startProcessing(): void {
    const domainConfig = this.domainConfigMap.get(this.domainID);
    const parser = domainConfig?.parser;
    const processor = domainConfig?.processor;
    if (!processor || !parser) {
      throw new Error(
        `Invalid processor/parser initialization for domain ${this.domainID}`,
      );
    }
    const processorInstance = processor.getProcessor(
      this.rpcUrls,
      domainConfig.domainData,
    );
    processorInstance.run(
      new TypeormDatabase({
        stateSchema: this.domainID.toString(),
        isolationLevel: "READ COMMITTED",
      }),
      async (ctx) => {
        const deposits: DecodedDepositLog[] = [];
        const executions: DecodedProposalExecutionLog[] = [];
        const failedHandlerExecutions: DecodedFailedHandlerExecution[] = [];
        for (const block of ctx.blocks) {
          for (const log of block.logs) {
            if (log.topics[0] === bridge.events.Deposit.topic) {
              deposits.push(
                await parser.parseDeposit(
                  log,
                  domainConfig.domainData,
                  this.domainConfigMap,
                ),
              );
            } else if (
              log.topics[0] === bridge.events.ProposalExecution.topic
            ) {
              executions.push(
                parser.parseProposalExecution(log, domainConfig.domainData),
              );
            } else if (
              log.topics[0] === bridge.events.FailedHandlerExecution.topic
            ) {
              failedHandlerExecutions.push(
                parser.parseFailedHandlerExecution(
                  log,
                  domainConfig.domainData,
                ),
              );
            }
          }
        }
        await processor.processDeposits(ctx, deposits);
        await processor.processExecutions(ctx, executions);
        await processor.processFailedExecutions(ctx, failedHandlerExecutions);
      },
    );
  }
}
export type Fields = EvmBatchProcessorFields<EvmBatchProcessor>; // | SubstrateBatchProcessorFields<SubstrateBatchProcessor> ;
export type Context = DataHandlerContext<Store, Fields>;
export type Block = BlockHeader<Fields>;
export type Log = _Log<Fields>;
export type Transaction = _Transaction<Fields>;
