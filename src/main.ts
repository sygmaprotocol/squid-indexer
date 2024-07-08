/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import { TypeormDatabase} from '@subsquid/typeorm-store'
import * as bridge from './abi/bridge'
import { processor} from './evmProcessor'
import { parseDeposit, parseFailedHandlerExecution, parseProposalExecution } from './evmIndexer/utils'
import { DecodedDepositLog, DecodedFailedHandlerExecution, DecodedProposalExecutionLog } from './evmIndexer/evmTypes'
import { getSharedConfig, getSsmDomainConfig } from './config'
import { ethers } from 'ethers'
import { processDeposits, processExecutions, processFailedExecutions } from './evmIndexer/evmIndexer'
import { logger } from './utils/logger'

async function startProcessing() {
    try {
        
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
        const sharedConfig = await getSharedConfig(process.env.SHARED_CONFIG_URL!)
        const thisDomain = sharedConfig.domains.find(domain => domain.id == Number(process.env.DOMAIN_ID))!
        const substrateRpcUrlConfig= await getSsmDomainConfig(process.env.SUPPORTED_SUBSTRATE_RPCS!)

        logger.info("Process initialization completed successfully.");

        processor.run(new TypeormDatabase({stateSchema: process.env.DOMAIN_ID, isolationLevel: "READ COMMITTED"}), async (ctx) => {
            let deposits: DecodedDepositLog[] = [];
            let executions: DecodedProposalExecutionLog[] = [];
            let failedHandlerExecutions: DecodedFailedHandlerExecution[] = [];
            for (let block of ctx.blocks) {
                for (let log of block.logs) {
                    if (log.topics[0] === bridge.events.Deposit.topic) {
                        let event = bridge.events.Deposit.decode(log);
                        let toDomain = sharedConfig.domains.find(domain => domain.id == event.destinationDomainID);
                        deposits.push(await parseDeposit(log, thisDomain, toDomain!, provider, substrateRpcUrlConfig));
                    } else if (log.topics[0] === bridge.events.ProposalExecution.topic) {
                        executions.push(parseProposalExecution(log, thisDomain));
                    } else if (log.topics[0] === bridge.events.FailedHandlerExecution.topic) {
                        failedHandlerExecutions.push(parseFailedHandlerExecution(log, thisDomain));
                    }
                }
            }
            
            await processDeposits(ctx, deposits);
            await processExecutions(ctx, executions);
            await processFailedExecutions(ctx, failedHandlerExecutions);
        });
    } catch (error) {
        logger.error("Process initialization or execution failed:", error);
    }
}

startProcessing();

  
