import {  EntityManager,  } from "typeorm"
import {  Domain,  Resource, } from './model'
import { getSharedConfig, Domain as DomainConfig } from "./config"
import { initDatabase } from "./utils"

async function main(): Promise<void> {
    const dataSource = await initDatabase()

    const sharedConfig = await getSharedConfig(process.env.SHARED_CONFIG_URL!)

    await insertDomains(sharedConfig.domains, dataSource.manager)   
    await dataSource.destroy()
}

async function insertDomains(
    domains: Array<DomainConfig>,
    manager: EntityManager
  ): Promise<void> {
    for (const domain of domains) {
        await manager.upsert(Domain, {id: domain.id.toString(), lastIndexedBlock: domain.startBlock.toString(), name: domain.name }, ["id"])
        for (const resource of domain.resources) {
            await manager.upsert(Resource, 
                { id: resource.resourceId, type: resource.type, decimals: resource.decimals },
            ["id"])
        }
    }
}
  
main().then(() => {
    console.log("Initialization completed successfully.");
  }).catch(error => {
    console.error("Initialization failed:", error);
  });