/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/

import { getSharedConfig, getRpcMap, getDomainConfig } from "./indexer/config";
import { Indexer } from "./indexer/indexer";
import { logger } from "./utils/logger";

async function startProcessing(): Promise<void> {
  const rpcUrls = getRpcMap();
  const sharedConfig = await getSharedConfig();
  const domainConfig = getDomainConfig(sharedConfig, rpcUrls);

  const indexer = new Indexer(
    Number(process.env.DOMAIN_ID),
    rpcUrls,
    domainConfig,
  );
  indexer.startProcessing();
}

startProcessing()
  .then(() => {
    logger.info("Processing started successfully.");
  })
  .catch((error) => {
    logger.error("An error occurred during processing:", error);
  });
