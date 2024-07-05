/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import {assertNotNull} from '@subsquid/evm-processor'
import * as bridge from '../../abi/bridge'
import { Log } from '../../evmProcessor'
import { DecodedDepositLog, DecodedFailedHandlerExecution, DecodedProposalExecutionLog, DepositType, FeeData } from '../evmTypes'
import { AbiCoder, BigNumberish, BytesLike, Provider, ethers, formatUnits, getBytes } from 'ethers'
import { DomainTypes, Domain as DomainConfig, ResourceTypes, getSsmDomainConfig, EvmResource } from '../../config'
import { logger } from '../../utils/logger'
import { MultiLocation } from "@polkadot/types/interfaces"
import { ApiPromise, WsProvider } from "@polkadot/api"
import { getERC20Contract, getFeeRouterContract } from "../../services/contract"
import { randomUUID } from 'crypto'


export const nativeTokenAddress = "0x0000000000000000000000000000000000000000"
type Junction = {
    accountId32?: {
      id: string
    }
}
type FeeDataResponse = {
  fee: string
  tokenAddress: string
}

export async function parseDeposit(log: Log, fromDomain: DomainConfig, toDomain: DomainConfig, provider: Provider, substrateRpcUrlConfig: Map<number, ApiPromise>): Promise<DecodedDepositLog> {

  let event = bridge.events.Deposit.decode(log)
  const resource = fromDomain.resources.find(resource => resource.resourceId == event.resourceID)!
  const resourceType = resource.type || ""
  const resourceDecimals = resource.decimals || 18

  let transaction = assertNotNull(log.transaction, "Missing transaction")

  return {
        id: log.id, 
        blockNumber: log.block.height,
        depositNonce: event.depositNonce,
        toDomainID: event.destinationDomainID,
        sender: transaction.from,
        destination: await parseDestination(event.data as BytesLike, toDomain, resourceType, substrateRpcUrlConfig) as string,
        fromDomainID: Number(fromDomain.id),
        resourceID: resource.resourceId, 
        txHash: log.transactionHash,
        timestamp: new Date(log.block.timestamp),
        depositData: event.data,
        handlerResponse: event.handlerResponse,
        transferType: resourceType,
        amount: decodeAmountsOrTokenId(event.data as string, resourceDecimals, resourceType) as string,
        fee: await getFee(log, fromDomain, provider),
      }
}

export async function parseDestination(hexData: BytesLike, domain: DomainConfig, resourceType: string, substrateRpcUrlConfig: Map<number, ApiPromise>): Promise<string> {
    const arrayifyData = getBytes(hexData)
    let recipient = ""
    switch (resourceType) {
      case ResourceTypes.FUNGIBLE:
      case ResourceTypes.NON_FUNGIBLE: {
        const recipientlen = Number("0x" + Buffer.from(arrayifyData.slice(32, 64)).toString("hex"))
        recipient = "0x" + Buffer.from(arrayifyData.slice(64, 64 + recipientlen)).toString("hex")
        break
      }
      case ResourceTypes.PERMISSIONLESS_GENERIC:
        {
          // 32 + 2 + 1 + 1 + 20 + 20
          const lenExecuteFuncSignature = Number("0x" + Buffer.from(arrayifyData.slice(32, 34)).toString("hex"))
          const lenExecuteContractAddress = Number(
            "0x" + Buffer.from(arrayifyData.slice(34 + lenExecuteFuncSignature, 35 + lenExecuteFuncSignature)).toString("hex"),
          )
          recipient =
            "0x" +
            Buffer.from(arrayifyData.slice(35 + lenExecuteFuncSignature, 35 + lenExecuteFuncSignature + lenExecuteContractAddress)).toString("hex")
        }
        break
      default:
        logger.error(`Unsupported resource type: ${resourceType}`)
        return ""
    }
  
    let destination = ""
    switch(domain.type){
      case DomainTypes.EVM:
        destination = recipient
        break
      case DomainTypes.SUBSTRATE:
        let substrateAPI = substrateRpcUrlConfig.get(domain.id)
        destination = await parseSubstrateDestination(recipient, substrateAPI!)
        break
      default: 
        logger.error(`Unsupported domain type: ${domain.type}`)
        throw new Error(`unexpected domain type`)
    }
    return destination
  }
  
  async function parseSubstrateDestination(recipient: string, substrateAPI: ApiPromise): Promise<string> {
  
    const decodedData = substrateAPI.createType("MultiLocation", recipient)
    const multiAddress = decodedData.toJSON() as unknown as MultiLocation
    for (const [, junctions] of Object.entries(multiAddress.interior)) {
      const junston = junctions as Junction
      if (junston.accountId32?.id) {
        return junston.accountId32.id
      }
    }
    return ""
  }


  function decodeAmountsOrTokenId(data: string, decimals: number, resourceType: string): string | Error {
    switch (resourceType) {
      case DepositType.FUNGIBLE: {
        const amount = AbiCoder.defaultAbiCoder().decode(["uint256"], data)[0] as BigNumberish
        return formatUnits(amount, decimals)
      }
      case DepositType.NONFUNGIBLE: {
        const tokenId = AbiCoder.defaultAbiCoder().decode(["uint256"], data)[0] as number
        return tokenId.toString()
      }
      case DepositType.SEMIFUNGIBLE: {
        return ""
      }
      case DepositType.PERMISSIONLESS_GENERIC: {
        return ""
      }
      case DepositType.PERMISSIONED_GENERIC: {
        return ""
      }
      default:
        throw new Error(`Unknown resource type ${resourceType}`)
    }
  }

  export function parseProposalExecution(
    log: Log,
    toDomain: DomainConfig,
  ): DecodedProposalExecutionLog {
    let event = bridge.events.ProposalExecution.decode(log)

    return {
      id: log.id,
      blockNumber: log.block.height,
      from: log.transaction!.from,
      depositNonce: event.depositNonce,
      txHash: log.transactionHash,
      timestamp: new Date(log.block.timestamp),
      fromDomainID: event.originDomainID,
      toDomainID: Number(toDomain.id)
    }
  }

  export function parseFailedHandlerExecution(log: Log, toDomain: DomainConfig): DecodedFailedHandlerExecution {
    let event = bridge.events.FailedHandlerExecution.decode(log)

    return {
      id: log.id,
      fromDomainID: event.originDomainID,
      toDomainID: toDomain.id,
      depositNonce: event.depositNonce,
      txHash: log.transactionHash,
      message: ethers.decodeBytes32String("0x" + Buffer.from(event.lowLevelData.slice(-64)).toString()),
      blockNumber: log.block.height,
      timestamp: new Date(log.block.timestamp),
    }
  }


  export async function getFee(log: Log, fromDomain: DomainConfig, provider: Provider): Promise<FeeData> {
    try {
      let event = bridge.events.Deposit.decode(log)
      
      const feeRouter = getFeeRouterContract(provider, fromDomain.feeRouter)
      
      const fee = (await feeRouter.calculateFee(
        event.user as string,
        fromDomain.id as number,
        event.destinationDomainID as number,
        event.resourceID as string,
        event.data as string,
        "0x00",
      )) as FeeDataResponse
    
      let tokenSymbol: string
      let decimals: number
      if (fee.tokenAddress != nativeTokenAddress) {
        const token = getERC20Contract(provider, fee.tokenAddress)
        tokenSymbol = (await token.symbol()) as string
        decimals = Number(await token.decimals())
      } else {
        tokenSymbol = fromDomain.nativeTokenSymbol
        decimals = fromDomain.nativeTokenDecimals
      }
    
      return {
        id: randomUUID(),
        tokenAddress: fee.tokenAddress,
        tokenSymbol: tokenSymbol,
        decimals: decimals,
        amount: fee.fee.toString(),
      }
    } catch (err) {
      logger.error("Calculating fee failed", err)
      return {
        id: randomUUID(), 
        tokenAddress: "",
        tokenSymbol: "",
        decimals: 0,
        amount: "0",
      }
    }
  }