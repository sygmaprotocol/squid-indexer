/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/

import { Network } from "@buildwithsygma/core";
import { ethers } from "ethers";

import { fetchSharedConfig } from "./indexer/config";
import { getDomainMetadata, getEnv } from "./indexer/config/envLoader";
import { EVMParser } from "./indexer/evmIndexer/evmParser";
import { EVMProcessor } from "./indexer/evmIndexer/evmProcessor";
import { Indexer } from "./indexer/indexer";
import { SubstrateParser } from "./indexer/substrateIndexer/substrateParser";
import { SubstrateProcessor } from "./indexer/substrateIndexer/substrateProcessor";
import { init } from "./main_init";
import { getLogger } from "./utils/logger";

async function startProcessing(): Promise<void> {
  await init();
  const envVars = getEnv();
  const sharedConfig = await fetchSharedConfig(envVars.sharedConfigURL);
  let processor;
  for (const domain of sharedConfig.domains) {
    const logger = getLogger(domain.id.toString());
    let domainMetadata;
    try {
      domainMetadata = getDomainMetadata(domain.id.toString());
    } catch (err) {
      logger.error(err);
      continue;
    }
    switch (domain.type) {
      case Network.EVM: {
        const provider = new ethers.JsonRpcProvider(domainMetadata.rpcUrl);
        processor = new EVMProcessor(
          new EVMParser(provider, logger),
          domainMetadata.rpcUrl,
          logger,
        );
        break;
      }
      case Network.SUBSTRATE: {
        processor = new SubstrateProcessor(
          new SubstrateParser(logger),
          domainMetadata.rpcUrl,
          logger,
        );
        break;
      }
      default:
        throw new Error(`Unsupported domain type ${domain.type}`);
    }
    domain.gateway = domainMetadata.domainGateway;
    const indexer = new Indexer(processor, domain, logger);
    indexer.startProcessing();
  }
}

startProcessing()
  .then(() => {
    getLogger().info("Processing started successfully.");
  })
  .catch((error) => {
    getLogger().error("An error occurred during processing:", error);
  });
