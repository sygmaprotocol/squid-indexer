/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import { ResourceType } from "@buildwithsygma/core";
import type { EntityManager } from "typeorm";

import type { Domain as DomainConfig } from "./indexer/config";
import { fetchSharedConfig } from "./indexer/config";
import type { DomainMetadata } from "./indexer/config/validator";
import { getInitEnv } from "./indexer/config/validator";
import { Domain, Resource, Token } from "./model";
import { initDatabase } from "./utils";
import { logger } from "./utils/logger";

const NATIVE_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000";

async function main(): Promise<void> {
  const envVars = getInitEnv();
  const dataSource = await initDatabase(envVars.dbConfig);
  const sharedConfig = await fetchSharedConfig(envVars.sharedConfigURL);

  await insertDomains(
    sharedConfig.domains,
    dataSource.manager,
    envVars.domainMetadata,
  );
  await dataSource.destroy();
}

async function insertDomains(
  domains: Array<DomainConfig>,
  manager: EntityManager,
  domainMetadata: DomainMetadata,
): Promise<void> {
  for (const domain of domains) {
    await manager.upsert(
      Domain,
      {
        id: domain.id.toString(),
        name: domain.name,
        iconUrl: domainMetadata[domain.id]?.iconUrl ?? "",
        explorerUrl: domainMetadata[domain.id]?.explorerUrl ?? "",
      },
      ["id"],
    );
    await manager.upsert(
      Token,
      {
        decimals: domain.nativeTokenDecimals,
        tokenSymbol: domain.nativeTokenSymbol,
        tokenAddress: NATIVE_TOKEN_ADDRESS,
        domainID: domain.id.toString(),
      },
      ["tokenAddress", "domainID"],
    );

    for (const r of domain.resources) {
      const resource = {
        id: r.resourceId.toLowerCase(),
        type: r.type,
      };
      await manager.upsert(Resource, resource, ["id"]);
      if (r.type == ResourceType.PERMISSIONLESS_GENERIC) {
        continue;
      }
      const token = {
        decimals: r.decimals,
        tokenSymbol: r.symbol,
        tokenAddress:
          "address" in r ? r.address : JSON.stringify(r.xcmMultiAssetId),
        domainID: domain.id.toString(),
        resourceID: r.resourceId,
      };
      await manager.upsert(Token, token, ["tokenAddress", "domainID"]);
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
