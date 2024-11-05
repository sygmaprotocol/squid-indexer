/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type { EvmResource, SubstrateResource } from "@buildwithsygma/core";
import type { EntityManager } from "typeorm";

import type { Domain as DomainConfig } from "./indexer/config";
import { fetchSharedConfig } from "./indexer/config";
import { getEnv } from "./indexer/config/validator";
import { Domain, Resource } from "./model";
import { initDatabase } from "./utils";
import { logger } from "./utils/logger";

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
    for (const resource of domain.resources as Array<
      EvmResource | SubstrateResource
    >) {
      await manager.upsert(
        Resource,
        {
          id: resource.resourceId,
          type: resource.type,
          decimals: resource.decimals,
          tokenAddress:
            "address" in resource
              ? resource.address
              : resource.assetID?.toString(),
        },
        ["id"],
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
