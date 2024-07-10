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
import { Store } from "@subsquid/typeorm-store";
import * as bridge from "./abi/bridge";
import { getProcessorConfig, ProcessorConfig, validateConfig } from "./config";
import { logger } from "./utils/logger";

let processorConfig: ProcessorConfig
try {
  processorConfig = getProcessorConfig();
  validateConfig(processorConfig);
} catch(error){
  logger.error("Processor configuration validation failed: ", error)
  process.exit(1)
}

export const processor = new EvmBatchProcessor()
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
      transactionHash: true,
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

export type Fields = EvmBatchProcessorFields<typeof processor>;
export type Context = DataHandlerContext<Store, Fields>;
export type Block = BlockHeader<Fields>;
export type Log = _Log<Fields>;
export type Transaction = _Transaction<Fields>;
