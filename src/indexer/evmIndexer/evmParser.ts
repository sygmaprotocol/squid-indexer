/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/

import { randomUUID } from "crypto";

import { ResourceType } from "@buildwithsygma/sygma-sdk-core";
import ERC20Contract from "@openzeppelin/contracts/build/contracts/ERC20.json";
import type { Log } from "@subsquid/evm-processor";
import { assertNotNull, decodeHex } from "@subsquid/evm-processor";
import type { BigNumberish, JsonRpcProvider, Provider } from "ethers";
import { AbiCoder, Contract, ethers, formatUnits } from "ethers";

import * as FeeHandlerRouter from "../../abi/FeeHandlerRouter.json";
import * as bridge from "../../abi/bridge";
import { logger } from "../../utils/logger";
import type { Domain } from "../config";
import type { IParser } from "../indexer";
import type {
  DecodedDepositLog,
  DecodedFailedHandlerExecution,
  DecodedProposalExecutionLog,
  FeeData,
} from "../types";

import { ContractType } from "./evmTypes";

type FeeDataResponse = {
  fee: string;
  tokenAddress: string;
};
export class EVMParser implements IParser {
  private nativeTokenAddress = "0x0000000000000000000000000000000000000000";
  private STATIC_FEE_DATA = "0x00";
  private provider: JsonRpcProvider;
  private parsers!: Map<number, IParser>;
  constructor(rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  public init(parsers: Map<number, IParser>): void {
    this.parsers = parsers;
  }
  public async parseDeposit(
    log: Log,
    fromDomain: Domain,
  ): Promise<DecodedDepositLog> {
    const event = bridge.events.Deposit.decode(log);
    const destinationParser = this.parsers.get(event.destinationDomainID);
    if (!destinationParser) {
      throw new Error(
        `Destination domain id ${event.destinationDomainID} not supported`,
      );
    }
    const resource = fromDomain.resources.find(
      (resource) => resource.resourceId == event.resourceID,
    );
    if (!resource) {
      throw new Error(
        `Resource with ID ${event.resourceID} not found in shared configuration`,
      );
    }
    const resourceType = resource.type || "";
    const resourceDecimals = resource.decimals || 18;

    const transaction = assertNotNull(log.transaction, "Missing transaction");

    return {
      id: this.generateTransferID(
        event.depositNonce.toString(),
        fromDomain.id.toString(),
        event.destinationDomainID.toString(),
      ),
      blockNumber: log.block.height,
      depositNonce: event.depositNonce,
      toDomainID: event.destinationDomainID,
      sender: transaction.from,
      destination: destinationParser.parseDestination(event.data, resourceType),
      fromDomainID: fromDomain.id,
      resourceID: resource.resourceId,
      txHash: transaction.hash,
      timestamp: new Date(log.block.timestamp),
      depositData: event.data,
      handlerResponse: event.handlerResponse,
      transferType: resourceType,
      amount: this.decodeAmountsOrTokenId(
        event.data,
        resourceDecimals,
        resourceType,
      ) as string,
      fee: await this.getFee(event, fromDomain, this.provider),
    };
  }

  public parseProposalExecution(
    log: Log,
    toDomain: Domain,
  ): DecodedProposalExecutionLog {
    const event = bridge.events.ProposalExecution.decode(log);
    const transaction = assertNotNull(log.transaction, "Missing transaction");

    return {
      id: this.generateTransferID(
        event.depositNonce.toString(),
        event.originDomainID.toString(),
        toDomain.id.toString(),
      ),
      blockNumber: log.block.height,
      depositNonce: event.depositNonce,
      txHash: transaction.hash,
      timestamp: new Date(log.block.timestamp),
      fromDomainID: event.originDomainID,
      toDomainID: toDomain.id,
    };
  }

  public parseFailedHandlerExecution(
    log: Log,
    toDomain: Domain,
  ): DecodedFailedHandlerExecution {
    const event = bridge.events.FailedHandlerExecution.decode(log);
    const transaction = assertNotNull(log.transaction, "Missing transaction");

    return {
      id: this.generateTransferID(
        event.depositNonce.toString(),
        event.originDomainID.toString(),
        toDomain.id.toString(),
      ),
      fromDomainID: event.originDomainID,
      toDomainID: toDomain.id,
      depositNonce: event.depositNonce,
      txHash: transaction.hash,
      message: ethers.decodeBytes32String(
        "0x" + Buffer.from(event.lowLevelData).subarray(-64).toString(),
      ),
      blockNumber: log.block.height,
      timestamp: new Date(log.block.timestamp),
    };
  }

  public parseDestination(hexData: string, resourceType: ResourceType): string {
    const arrayifyData = decodeHex(hexData);
    let recipient = "";
    switch (resourceType) {
      case ResourceType.FUNGIBLE:
      case ResourceType.NON_FUNGIBLE: {
        const recipientlen = Number(
          "0x" + arrayifyData.subarray(32, 64).toString("hex"),
        );
        recipient =
          "0x" + arrayifyData.subarray(64, 64 + recipientlen).toString("hex");
        break;
      }
      case ResourceType.PERMISSIONLESS_GENERIC:
        {
          // 32 + 2 + 1 + 1 + 20 + 20
          const lenExecuteFuncSignature = Number(
            "0x" + arrayifyData.subarray(32, 34).toString("hex"),
          );
          const lenExecuteContractAddress = Number(
            "0x" +
              arrayifyData
                .subarray(
                  34 + lenExecuteFuncSignature,
                  35 + lenExecuteFuncSignature,
                )
                .toString("hex"),
          );
          recipient =
            "0x" +
            arrayifyData
              .subarray(
                35 + lenExecuteFuncSignature,
                35 + lenExecuteFuncSignature + lenExecuteContractAddress,
              )
              .toString("hex");
        }
        break;
      default:
        logger.error(`Unsupported resource type: ${resourceType}`);
        return "";
    }
    return recipient;
  }

  private async getFee(
    event: bridge.DepositEventArgs,
    fromDomain: Domain,
    provider: Provider,
  ): Promise<FeeData> {
    try {
      const feeRouter = this.getContract(
        provider,
        fromDomain.feeRouter,
        ContractType.FEE_ROUTER,
      );

      const fee = (await feeRouter.calculateFee(
        event.user,
        fromDomain.id,
        event.destinationDomainID,
        event.resourceID,
        event.data,
        this.STATIC_FEE_DATA,
      )) as FeeDataResponse;

      let tokenSymbol: string;
      let decimals: number;
      if (fee.tokenAddress != this.nativeTokenAddress) {
        const token = this.getContract(
          provider,
          fee.tokenAddress,
          ContractType.ERC20,
        );
        tokenSymbol = (await token.symbol()) as string;
        decimals = Number(await token.decimals());
      } else {
        tokenSymbol = fromDomain.nativeTokenSymbol;
        decimals = fromDomain.nativeTokenDecimals;
      }

      return {
        id: randomUUID(),
        tokenAddress: fee.tokenAddress,
        tokenSymbol: tokenSymbol,
        decimals: decimals,
        amount: fee.fee.toString(),
      };
    } catch (err) {
      logger.error("Calculating fee failed", err);
      return {
        id: randomUUID(),
        tokenAddress: "",
        tokenSymbol: "",
        decimals: 0,
        amount: "0",
      };
    }
  }

  private getContract(
    provider: Provider,
    contractAddress: string,
    contractType: ContractType,
  ): Contract {
    switch (contractType) {
      case ContractType.ERC20:
        return new Contract(contractAddress, ERC20Contract.abi, provider);
      case ContractType.FEE_ROUTER:
        return new Contract(contractAddress, FeeHandlerRouter.abi, provider);
    }
  }
  private decodeAmountsOrTokenId(
    data: string,
    decimals: number,
    resourceType: ResourceType,
  ): string | Error {
    switch (resourceType) {
      case ResourceType.FUNGIBLE: {
        const amount = AbiCoder.defaultAbiCoder().decode(
          ["uint256"],
          data,
        )[0] as BigNumberish;
        return formatUnits(amount, decimals);
      }
      case ResourceType.NON_FUNGIBLE: {
        const tokenId = AbiCoder.defaultAbiCoder().decode(
          ["uint256"],
          data,
        )[0] as bigint;
        return tokenId.toString();
      }
      default:
        return "";
    }
  }

  private generateTransferID(
    depositNonce: string,
    fromDomainID: string,
    toDomainID: string,
  ): string {
    return depositNonce + "-" + fromDomainID + "-" + toDomainID;
  }
}
