/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import { Network, ResourceType } from "@buildwithsygma/core";
import type { EntityManager } from "typeorm";

import type { Domain as DomainConfig } from "./indexer/config";
import { fetchSharedConfig } from "./indexer/config";
import { getEnv } from "./indexer/config/validator";
import { Domain, Resource } from "./model";
import { initDatabase } from "./utils";
import { logger } from "./utils/logger";

const NATIVE_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000";

async function main(): Promise<void> {
  const envVars = getEnv();
  const dataSource = await initDatabase(envVars.dbConfig);
  const sharedConfig = await fetchSharedConfig(envVars.sharedConfigURL);

  await insertDomains(sharedConfig.domains, dataSource.manager);
  await dataSource.destroy();
}

async function insertDomains(
  domains: Array<DomainConfig>,
  manager: EntityManager,
): Promise<void> {
  for (const domain of domains) {
    await manager.upsert(
      Domain,
      {
        id: domain.id.toString(),
        name: domain.name,
      },
      ["id"],
    );
    let isNativeInserted = false;
    for (const r of domain.resources) {
      const resource = {
        id: r.resourceId,
        type: r.type,
        decimals: r.decimals,
        tokenSymbol: r.symbol,
        tokenAddress: "address" in r ? r.address : r.assetID?.toString(),
        domainID: domain.id.toString(),
      };
      await manager.upsert(Resource, resource, ["id", "domainID"]);
      if (resource.tokenAddress == NATIVE_TOKEN_ADDRESS) {
        isNativeInserted = true;
      }
    }
    // if native token is not defined in resources in shared-config, insert default native token
    if (!isNativeInserted && domain.type == Network.EVM) {
      await manager.upsert(
        Resource,
        {
          id: "0x00",
          type: ResourceType.FUNGIBLE,
          decimals: domain.nativeTokenDecimals,
          tokenSymbol: domain.nativeTokenSymbol,
          tokenAddress: NATIVE_TOKEN_ADDRESS,
          domainID: domain.id.toString(),
        },
        ["id", "domainID"],
      );
    }
  }
}

main()
  .then(() => {
    logger.info("Initialization completed successfully.");
  })
  .catch((error) => {
    logger.error("Initialization failed:", error);
  });
