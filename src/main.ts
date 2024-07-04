import { TypeormDatabase} from '@subsquid/typeorm-store'
import * as bridge from './abi/bridge'
import { processor} from './evmProcessor'
import { parseDeposit, parseFailedHandlerExecution, parseProposalExecution } from './evmIndexer/utils'
import { DecodedDepositLog, DecodedFailedHandlerExecution, DecodedProposalExecutionLog } from './evmIndexer/evmTypes'
import { getSharedConfig, Domain as DomainConfig, SharedConfig } from './config'
import { ethers } from 'ethers'
import { processDeposits, processExecutions, processFailedExecutions } from './evmIndexer/evmIndexer'
import { logger } from './utils/logger'

let provider: ethers.JsonRpcProvider
let sharedConfig: SharedConfig
let thisDomain: DomainConfig
async function initProcess(): Promise<void> {
    provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
    sharedConfig = await getSharedConfig(process.env.SHARED_CONFIG_URL!)
    thisDomain = sharedConfig.domains.find(domain => domain.id == Number(process.env.DOMAIN_ID))!
}

initProcess().then(() => {
    logger.info("Process initialization completed successfully.");
  }).catch(error => {
    logger.error("Process initialization failed:", error);
  });

processor.run(new TypeormDatabase({stateSchema: process.env.DOMAIN_ID, isolationLevel: "READ COMMITTED"}), async (ctx) => {
    let deposits: DecodedDepositLog[] = []
    let executions: DecodedProposalExecutionLog[] = []
    let failedHandlerExecutions: DecodedFailedHandlerExecution[] = []
    for (let block of ctx.blocks) {
        for (let log of block.logs) {
            if (log.topics[0] === bridge.events.Deposit.topic) {
                let event = bridge.events.Deposit.decode(log)
                let toDomain = sharedConfig.domains.find(domain => domain.id == event.destinationDomainID)
                deposits.push(await parseDeposit(log, thisDomain, toDomain!, provider))
            } else if (log.topics[0] === bridge.events.ProposalExecution.topic){
                executions.push(parseProposalExecution(log, thisDomain))
            } else if (log.topics[0] === bridge.events.FailedHandlerExecution.topic){
                failedHandlerExecutions.push(parseFailedHandlerExecution(log, thisDomain))
            }
        }
    }
    await processDeposits(ctx, deposits)
    await processExecutions(ctx, executions)
    await processFailedExecutions(ctx, failedHandlerExecutions)
})

  
