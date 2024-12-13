/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/

import { Network } from "@buildwithsygma/core";
import { ethers } from "ethers";

import { getDomainConfig } from "./indexer/config";
import { getEnv } from "./indexer/config/envLoader";
import { EVMParser } from "./indexer/evmIndexer/evmParser";
import { EVMProcessor } from "./indexer/evmIndexer/evmProcessor";
import { Indexer } from "./indexer/indexer";
import { SubstrateParser } from "./indexer/substrateIndexer/substrateParser";
import { SubstrateProcessor } from "./indexer/substrateIndexer/substrateProcessor";
import { logger } from "./utils/logger";

async function startProcessing(): Promise<void> {
  const envVars = getEnv();
  const domainConfig = await getDomainConfig(envVars);
  let processor;
  switch (domainConfig.type) {
    case Network.EVM: {
      const provider = new ethers.JsonRpcProvider(
        envVars.domainMetadata.rpcUrl,
      );
      processor = new EVMProcessor(
        new EVMParser(provider),
        envVars.domainMetadata.rpcUrl,
      );
      break;
    }
    case Network.SUBSTRATE: {
      processor = new SubstrateProcessor(
        new SubstrateParser(),
        envVars.domainMetadata.rpcUrl,
      );
      break;
    }
    default:
      throw new Error(`Unsupported domain type ${domainConfig.type}`);
  }
  const indexer = new Indexer(processor, domainConfig);
  indexer.startProcessing();
}

startProcessing()
  .then(() => {
    logger.info("Processing started successfully.");
  })
  .catch((error) => {
    logger.error("An error occurred during processing:", error);
  });
