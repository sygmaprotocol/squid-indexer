/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import { startEvmProcessing } from "./evmProcessor";
import {
  getDomainConfig,
  getProcessorConfig,
  DomainTypes,
  getSharedConfig,
} from "./config";
import { logger } from "./utils/logger";

async function startProcessing(): Promise<void> {
  const processorConfig = getProcessorConfig();
  const domainConfig = getDomainConfig();

  const sharedConfig = await getSharedConfig(domainConfig.sharedConfigURL);
  const thisDomain = sharedConfig.domains.find(
    (domain) => domain.id == domainConfig.domainID
  )!;
  if (!thisDomain) {
    throw new Error(
      `Domain with ID ${domainConfig.domainID} not found in shared configuration`
    );
  }

  switch (domainConfig.domainType) {
    case DomainTypes.EVM:
      await startEvmProcessing(
        processorConfig,
        domainConfig,
        sharedConfig,
        thisDomain
      );
      break;
    default:
      throw new Error("Unsupported domain type");
  }
}

startProcessing()
  .then(() => {
    logger.info("Processing started successfully.");
  })
  .catch((error) => {
    logger.error("An error occurred during processing:", error);
  });
