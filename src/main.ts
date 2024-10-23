/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/

import { Network } from "@buildwithsygma/sygma-sdk-core";

import { getConfig } from "./indexer/config";
import { EVMProcessor } from "./indexer/evmIndexer/evmProcessor";
import { Indexer } from "./indexer/indexer";
import { logger } from "./utils/logger";

async function startProcessing(): Promise<void> {
  const config = await getConfig();
  let processor;
  if (config.domain.type == Network.EVM) {
    processor = new EVMProcessor(
      config.parser,
      config.rpcMap.get(config.domain.id)!,
    );
  } else {
    throw new Error(`Unsupported domain type ${config.domain.type}`);
  }
  const indexer = new Indexer(processor, config.domain);
  indexer.startProcessing();
}

startProcessing()
  .then(() => {
    logger.info("Processing started successfully.");
  })
  .catch((error) => {
    logger.error("An error occurred during processing:", error);
  });
