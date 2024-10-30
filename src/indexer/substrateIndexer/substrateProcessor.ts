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

import type { Domain } from "../config";
import type { DecodedEvents, IProcessor } from "../indexer";
import type {
  DecodedDepositLog,
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
  constructor(parser: ISubstrateParser, rpcUrl: string) {
    this.parser = parser;
    this.rpcUrl = rpcUrl;
    this.fieldSelection = {
      extrinsic: { hash: true },
      block: { timestamp: true },
    };
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
    if (process.env.DOMAIN_GATEWAY) {
      substrateProcessor.setGateway(process.env.DOMAIN_GATEWAY);
    }
    return substrateProcessor;
  }

  public processEvents(
    ctx: ProcessorContext<Store>,
    domain: Domain,
  ): DecodedEvents {
    const deposits: DecodedDepositLog[] = [];
    const executions: DecodedProposalExecutionLog[] = [];
    const failedHandlerExecutions: DecodedFailedHandlerExecutionLog[] = [];
    const fees: FeeCollectedData[] = [];
    for (const block of ctx.blocks) {
      for (const event of block.events) {
        if (event.name == events.sygmaBridge.deposit.name) {
          deposits.push(
            this.parser.parseDeposit(event, domain) as DecodedDepositLog,
          );
        } else if (event.name == events.sygmaBridge.proposalExecution.name) {
          executions.push(this.parser.parseProposalExecution(event, domain));
        } else if (
          event.name == events.sygmaBridge.failedHandlerExecution.name
        ) {
          failedHandlerExecutions.push(
            this.parser.parseFailedHandlerExecution(event, domain),
          );
        } else if (event.name == events.sygmaBridge.feeCollected.name) {
          fees.push(this.parser.parseFee(event, domain));
        }
      }
    }
    return { deposits, executions, failedHandlerExecutions, fees };
  }
}

export type Fields = SubstrateBatchProcessorFields<typeof SubstrateProcessor>;
export type Event = _Event<Fields>;
export type ProcessorContext<Store> = DataHandlerContext<Store, Fields>;
