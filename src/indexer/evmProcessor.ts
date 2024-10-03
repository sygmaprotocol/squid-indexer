/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type { ApiPromise } from "@polkadot/api";
import type {
  BlockHeader,
  DataHandlerContext,
  EvmBatchProcessorFields,
  Log as _Log,
  Transaction as _Transaction,
} from "@subsquid/evm-processor";
import { EvmBatchProcessor } from "@subsquid/evm-processor";
import type { Store } from "@subsquid/typeorm-store";
import { TypeormDatabase } from "@subsquid/typeorm-store";
import type { Provider } from "ethers";

import * as bridge from "../abi/bridge";

import type {
  Domain,
  DomainConfig,
  ProcessorConfig,
  SharedConfig,
} from "./config";
import {
  processDeposits,
  processExecutions,
  processFailedExecutions,
} from "./evmIndexer/evmIndexer";
import type {
  DecodedDepositLog,
  DecodedFailedHandlerExecution,
  DecodedProposalExecutionLog,
} from "./evmIndexer/evmTypes";
import {
  parseDeposit,
  parseFailedHandlerExecution,
  parseProposalExecution,
} from "./evmIndexer/utils";

let processor: EvmBatchProcessor;

export function startEvmProcessing(
  processorConfig: ProcessorConfig,
  domainConfig: DomainConfig,
  sharedConfig: SharedConfig,
  thisDomain: Domain,
  provider: Provider,
  substrateRpcUrlConfig: Map<number, ApiPromise>,
): void {
  processor = getEvmProcessor(processorConfig);

  processor.run(
    new TypeormDatabase({
      stateSchema: domainConfig.domainID.toString(),
      isolationLevel: "READ COMMITTED",
    }),
    async (ctx) => {
      const deposits: DecodedDepositLog[] = [];
      const executions: DecodedProposalExecutionLog[] = [];
      const failedHandlerExecutions: DecodedFailedHandlerExecution[] = [];
      for (const block of ctx.blocks) {
        for (const log of block.logs) {
          if (log.topics[0] === bridge.events.Deposit.topic) {
            const event = bridge.events.Deposit.decode(log);
            const toDomain = sharedConfig.domains.find(
              (domain) => domain.id == event.destinationDomainID,
            );
            if (!toDomain) {
              throw new Error(
                `Destination domain with ID ${event.destinationDomainID} not found in shared configuration`,
              );
            }
            deposits.push(
              await parseDeposit(
                log,
                thisDomain,
                toDomain,
                provider,
                substrateRpcUrlConfig,
              ),
            );
          } else if (log.topics[0] === bridge.events.ProposalExecution.topic) {
            executions.push(parseProposalExecution(log, thisDomain));
          } else if (
            log.topics[0] === bridge.events.FailedHandlerExecution.topic
          ) {
            failedHandlerExecutions.push(
              parseFailedHandlerExecution(log, thisDomain),
            );
          }
        }
      }
      await processDeposits(ctx, deposits);
      await processExecutions(ctx, executions);
      await processFailedExecutions(ctx, failedHandlerExecutions);
    },
  );
}

function getEvmProcessor(processorConfig: ProcessorConfig): EvmBatchProcessor {
  const evmProcessor = new EvmBatchProcessor()
    .setRpcEndpoint({
      url: processorConfig.rpcURL,
      rateLimit: 10,
    })
    .setBlockRange({ from: processorConfig.startBlock })
    .setFinalityConfirmation(processorConfig.numberOfConfirmations)
    .setFields({
      log: {
        topics: true,
      },
    })
    .addLog({
      address: [processorConfig.contractAddress],
      topic0: [bridge.events.ProposalExecution.topic],
      transaction: true,
    })
    .addLog({
      address: [processorConfig.contractAddress],
      topic0: [bridge.events.Deposit.topic],
      transaction: true,
    })
    .addLog({
      address: [processorConfig.contractAddress],
      topic0: [bridge.events.FailedHandlerExecution.topic],
      transaction: true,
    });

  if (processorConfig.gateway && processorConfig.gateway.trim() !== "") {
    evmProcessor.setGateway(processorConfig.gateway);
  }
  return evmProcessor;
}

export type Fields = EvmBatchProcessorFields<typeof processor>;
export type Context = DataHandlerContext<Store, Fields>;
export type Block = BlockHeader<Fields>;
export type Log = _Log<Fields>;
export type Transaction = _Transaction<Fields>;
