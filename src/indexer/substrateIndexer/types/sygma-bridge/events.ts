/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import {sts, Block, Bytes, Option, Result, EventType, RuntimeCtx} from '../support'
import * as v1250 from '../v1250'
import * as v1260 from '../v1260'

export const deposit =  {
    name: 'SygmaBridge.Deposit',
    /**
     * When initial bridge transfer send to dest domain
     * args: [dest_domain_id, resource_id, deposit_nonce, sender, transfer_type,
     * deposit_data, handler_response, ]
     */
    v1250: new EventType(
        'SygmaBridge.Deposit',
        sts.struct({
            destDomainId: sts.number(),
            resourceId: sts.bytes(),
            depositNonce: sts.bigint(),
            sender: v1250.AccountId32,
            transferType: v1250.TransferType,
            depositData: sts.bytes(),
            handlerResponse: sts.bytes(),
        })
    ),
}

export const proposalExecution =  {
    name: 'SygmaBridge.ProposalExecution',
    /**
     * When proposal was executed successfully
     */
    v1250: new EventType(
        'SygmaBridge.ProposalExecution',
        sts.struct({
            originDomainId: sts.number(),
            depositNonce: sts.bigint(),
            dataHash: sts.bytes(),
        })
    ),
}

export const failedHandlerExecution =  {
    name: 'SygmaBridge.FailedHandlerExecution',
    /**
     * When proposal was faild to execute
     */
    v1250: new EventType(
        'SygmaBridge.FailedHandlerExecution',
        sts.struct({
            error: sts.bytes(),
            originDomainId: sts.number(),
            depositNonce: sts.bigint(),
        })
    ),
}

export const feeCollected =  {
    name: 'SygmaBridge.FeeCollected',
    /**
     * When bridge fee is collected
     */
    v1260: new EventType(
        'SygmaBridge.FeeCollected',
        sts.struct({
            feePayer: v1260.AccountId32,
            destDomainId: sts.number(),
            resourceId: sts.bytes(),
            feeAmount: sts.bigint(),
            feeAssetId: v1260.V3AssetId,
        })
    ),
}
