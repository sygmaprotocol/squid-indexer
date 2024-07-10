/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import {
  BlockHeader,
  DataHandlerContext,
  EvmBatchProcessor,
  EvmBatchProcessorFields,
  Log as _Log,
  Transaction as _Transaction,
} from "@subsquid/evm-processor";
import { Store, TypeormDatabase } from "@subsquid/typeorm-store";
import { ethers } from "ethers";
import * as bridge from "./abi/bridge";
import {
  Domain,
  DomainConfig,
  getSsmDomainConfig,
  ProcessorConfig,
  SharedConfig,
} from "./config";
import { logger } from "./utils/logger";
import {
  DecodedDepositLog,
  DecodedFailedHandlerExecution,
  DecodedProposalExecutionLog,
} from "./evmIndexer/evmTypes";
import {
  parseDeposit,
  parseFailedHandlerExecution,
  parseProposalExecution,
} from "./evmIndexer/utils";
import {
  processDeposits,
  processExecutions,
  processFailedExecutions,
} from "./evmIndexer/evmIndexer";

let processor: EvmBatchProcessor;

export async function startEvmProcessing(
  processorConfig: ProcessorConfig,
  domainConfig: DomainConfig,
  sharedConfig: SharedConfig,
  thisDomain: Domain
): Promise<void> {
  processor = getEvmProcessor(processorConfig);

  const substrateRpcUrlConfig = await getSsmDomainConfig(
    domainConfig.supportedSubstrateRPCs
  );
  const provider = new ethers.JsonRpcProvider(domainConfig.rpcURL);

  logger.info("Process initialization completed successfully.");

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
              (domain) => domain.id == event.destinationDomainID
            );
            if (!toDomain) {
              throw new Error(
                `Destination domain with ID ${event.destinationDomainID} not found in shared configuration`
              );
            }
            deposits.push(
              await parseDeposit(
                log,
                thisDomain,
                toDomain,
                provider,
                substrateRpcUrlConfig
              )
            );
          } else if (log.topics[0] === bridge.events.ProposalExecution.topic) {
            executions.push(parseProposalExecution(log, thisDomain));
          } else if (
            log.topics[0] === bridge.events.FailedHandlerExecution.topic
          ) {
            failedHandlerExecutions.push(
              parseFailedHandlerExecution(log, thisDomain)
            );
          }
        }
      }
      await processDeposits(ctx, deposits);
      await processExecutions(ctx, executions);
      await processFailedExecutions(ctx, failedHandlerExecutions);
    }
  );
}

function getEvmProcessor(processorConfig: ProcessorConfig): EvmBatchProcessor {
  return new EvmBatchProcessor()
    .setGateway(processorConfig.gateway)
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
}

export type Fields = EvmBatchProcessorFields<typeof processor>;
export type Context = DataHandlerContext<Store, Fields>;
export type Block = BlockHeader<Fields>;
export type Log = _Log<Fields>;
export type Transaction = _Transaction<Fields>;
