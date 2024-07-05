/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import {
    BlockHeader,
    DataHandlerContext,
    EvmBatchProcessor,
    EvmBatchProcessorFields,
    Log as _Log,
    Transaction as _Transaction,
    assertNotNull,
    
} from '@subsquid/evm-processor'
import {Store} from '@subsquid/typeorm-store'
import * as bridge from './abi/bridge'

export const CONTRACT_ADDRESS = process.env.DOMAIN_BRIDGE_ADDRESS!

export const processor = new EvmBatchProcessor()
    .setGateway(process.env.DOMAIN_GATEWAY!)
    .setRpcEndpoint({
        url: assertNotNull(process.env.RPC_URL, 'No RPC endpoint supplied'),
        rateLimit: 10
    })
    .setBlockRange({from: parseInt(process.env.START_BLOCK || "0")})
    .setFinalityConfirmation(parseInt(process.env.DOMAIN_CONFIRMATIONS!) || 75)
    .setFields({
        log: {
            topics: true,
            transactionHash: true, 
        },
    })
    .addLog({
        address: [CONTRACT_ADDRESS],
        topic0: [bridge.events.ProposalExecution.topic],
        transaction: true,
    })
    .addLog({
        address: [CONTRACT_ADDRESS],
        topic0: [bridge.events.Deposit.topic],
        transaction: true,
    })
    .addLog({
        address: [CONTRACT_ADDRESS],
        topic0: [bridge.events.FailedHandlerExecution.topic],
        transaction: true,
    })

export type Fields = EvmBatchProcessorFields<typeof processor>
export type Context = DataHandlerContext<Store, Fields>
export type Block = BlockHeader<Fields>
export type Log = _Log<Fields>
export type Transaction = _Transaction<Fields>
