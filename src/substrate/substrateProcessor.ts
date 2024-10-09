/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type {
  DataHandlerContext,
  SubstrateBatchProcessorFields,
  Event as _Event,
} from "@subsquid/substrate-processor";
import {
  SubstrateBatchProcessor,
  Call as _Call,
  Extrinsic as _Extrinsic,
} from "@subsquid/substrate-processor";
import { TypeormDatabase } from "@subsquid/typeorm-store";

import type {
  Domain,
  DomainConfig,
  ProcessorConfig,
  SubstrateResource,
} from "../config";
import {
  processDeposits,
  processExecutions,
  processFailedExecutions,
  processFees,
} from "../indexer";
import type {
  DecodedDepositLog,
  DecodedFailedHandlerExecution,
  DecodedProposalExecutionLog,
  FeeCollectedData,
} from "../utils/types";

import { events } from "./types";
import {
  parseFee,
  parseSubstrateDeposit,
  parseSubstrateFailedHandlerExecution,
  parseSubstrateProposalExecution,
} from "./utils";

const fieldsConfig = {
  extrinsic: {
    hash: true,
  },
  block: {
    timestamp: true,
  },
};

let processor: SubstrateBatchProcessor<typeof fieldsConfig>;

export function startSubstrateProcessing(
  processorConfig: ProcessorConfig,
  domainConfig: DomainConfig,
  thisDomain: Domain,
): void {
  processor = getSubstrateProcessor(processorConfig);

  processor.run(
    new TypeormDatabase({
      stateSchema: domainConfig.domainID.toString(),
      isolationLevel: "READ COMMITTED",
    }),
    async (ctx) => {
      const deposits: DecodedDepositLog[] = [];
      const executions: DecodedProposalExecutionLog[] = [];
      const failedHandlerExecutions: DecodedFailedHandlerExecution[] = [];
      const fees: FeeCollectedData[] = [];
      for (const block of ctx.blocks) {
        for (const event of block.events) {
          if (event.name == events.sygmaBridge.deposit.name) {
            deposits.push(parseSubstrateDeposit(event, thisDomain));
          } else if (event.name == events.sygmaBridge.proposalExecution.name) {
            executions.push(
              parseSubstrateProposalExecution(event, thisDomain.id),
            );
          } else if (
            event.name == events.sygmaBridge.failedHandlerExecution.name
          ) {
            failedHandlerExecutions.push(
              parseSubstrateFailedHandlerExecution(event, thisDomain.id),
            );
          } else if (event.name == events.sygmaBridge.feeCollected.name) {
            fees.push(
              parseFee(event, thisDomain.resources as SubstrateResource[]),
            );
          }
        }
      }

      await processDeposits(ctx, deposits);
      await processExecutions(ctx, executions);
      await processFailedExecutions(ctx, failedHandlerExecutions);
      await processFees(ctx, fees);
    },
  );
}

function getSubstrateProcessor(
  processorConfig: ProcessorConfig,
): SubstrateBatchProcessor<Fields> {
  const substrateProcessor = new SubstrateBatchProcessor()
    .setRpcEndpoint({
      url: processorConfig.rpcURL,
      rateLimit: 10,
    })
    .setBlockRange({ from: processorConfig.startBlock })
    .setFinalityConfirmation(processorConfig.numberOfConfirmations)
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
    .setFields(fieldsConfig);
  if (processorConfig.gateway && processorConfig.gateway.trim() !== "") {
    substrateProcessor.setGateway(processorConfig.gateway);
  }
  return substrateProcessor;
}

export type Fields = SubstrateBatchProcessorFields<typeof processor>;
export type Event = _Event<Fields>;
export type ProcessorContext<Store> = DataHandlerContext<Store, Fields>;
