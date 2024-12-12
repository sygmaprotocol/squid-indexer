/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/

import { Network } from "@buildwithsygma/core";

import { getConfig } from "./indexer/config";
import { getEnv } from "./indexer/config/validator";
import { EVMProcessor } from "./indexer/evmIndexer/evmProcessor";
import { Indexer } from "./indexer/indexer";
import type { ISubstrateParser } from "./indexer/substrateIndexer/substrateParser";
import { SubstrateProcessor } from "./indexer/substrateIndexer/substrateProcessor";
import { logger } from "./utils/logger";

async function startProcessing(): Promise<void> {
  const envVars = getEnv();
  const config = await getConfig(envVars);
  let processor;
  switch (config.domain.type) {
    case Network.EVM: {
      processor = new EVMProcessor(
        config.parser,
        envVars.domainMetadata.rpcUrl,
      );
      break;
    }
    case Network.SUBSTRATE: {
      processor = new SubstrateProcessor(
        config.parser as ISubstrateParser,
        envVars.domainMetadata.rpcUrl,
      );
      break;
    }
    default:
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
