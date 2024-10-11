/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import { Network } from "@buildwithsygma/sygma-sdk-core";
import { caching } from "cache-manager";
import { ethers } from "ethers";

import {
  getDomainConfig,
  getProcessorConfig,
  getSharedConfig,
  getSsmDomainConfig,
} from "./config";
import { startEvmProcessing } from "./evmProcessor";
import CoinMarketCapService from "./services/coinmarketcap/coinmarketcap.service";
import { OfacComplianceService } from "./services/ofac";
import { logger } from "./utils/logger";

async function startProcessing(): Promise<void> {
  const processorConfig = getProcessorConfig();
  const domainConfig = getDomainConfig();
  const sharedConfig = await getSharedConfig();

  const thisDomain = sharedConfig.domains.find(
    (domain) => domain.id == domainConfig.domainID,
  );
  if (!thisDomain) {
    throw new Error(
      `Domain with ID ${domainConfig.domainID} not found in shared configuration`,
    );
  }

  const ttlInMins = Number(process.env.CACHE_TTL_IN_MINS) || 5;
  const memoryCache = await caching("memory", {
    ttl: ttlInMins * 1000,
  });
  const coinMarketCapServiceInstance = new CoinMarketCapService(
    process.env.COINMARKETCAP_API_KEY || "",
    process.env.COINMARKETCAP_API_URL || "",
    memoryCache,
  );

  const ofacComplianceService = new OfacComplianceService(
    process.env.CHAIN_ANALYSIS_URL || "",
    process.env.CHAIN_ANALYSIS_API_KEY || "",
  );

  switch (domainConfig.domainType) {
    case Network.EVM: {
      const provider = new ethers.JsonRpcProvider(domainConfig.rpcURL);
      const substrateRpcUrlConfig = await getSsmDomainConfig(
        domainConfig.supportedSubstrateRPCs,
      );

      logger.info("Process initialization completed successfully.");
      startEvmProcessing(
        processorConfig,
        domainConfig,
        sharedConfig,
        thisDomain,
        provider,
        substrateRpcUrlConfig,
        coinMarketCapServiceInstance,
        ofacComplianceService,
      );
      break;
    }
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
