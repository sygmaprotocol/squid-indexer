/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import { TypeormDatabase } from "@subsquid/typeorm-store";
import { ethers } from "ethers";
import * as bridge from "./abi/bridge";
import { processor } from "./evmProcessor";
import {
  parseDeposit,
  parseFailedHandlerExecution,
  parseProposalExecution,
} from "./evmIndexer/utils";
import {
  DecodedDepositLog,
  DecodedFailedHandlerExecution,
  DecodedProposalExecutionLog,
} from "./evmIndexer/evmTypes";
import {
  getSharedConfig,
  getSsmDomainConfig,
  getDomainConfig,
  validateConfig,
} from "./config";
import {
  processDeposits,
  processExecutions,
  processFailedExecutions,
} from "./evmIndexer/evmIndexer";
import { logger } from "./utils/logger";

async function startEVMProcessing(): Promise<void> {
  const domainConfig = getDomainConfig();
  validateConfig(domainConfig);

  const provider = new ethers.JsonRpcProvider(domainConfig.rpcURL);
  const sharedConfig = await getSharedConfig(domainConfig.sharedConfigURL);
  const thisDomain = sharedConfig.domains.find(
    (domain) => domain.id == domainConfig.domainID
  )!;
  if (!thisDomain) {
    throw new Error(
      `Domain with ID ${domainConfig.domainID} not found in shared configuration`
    );
  }

  const substrateRpcUrlConfig = await getSsmDomainConfig(
    domainConfig.supportedSubstrateRPCs
  );

  logger.info("Process initialization completed successfully.");

  processor.run(
    new TypeormDatabase({
      stateSchema: process.env.DOMAIN_ID,
      isolationLevel: "READ COMMITTED",
    }),
    async (ctx) => {
      const deposits: DecodedDepositLog[] = [];
      const executions: DecodedProposalExecutionLog[] = [];
      const failedHandlerExecutions: DecodedFailedHandlerExecution[] = [];
      for (const block of ctx.blocks) {
        for (const log of block.logs) {
          if (log.topics[0] === bridge.events.Deposit.topic) {
            const event = bridge.events.Deposit.decode(log);
            const toDomain = sharedConfig.domains.find(
              (domain) => domain.id == event.destinationDomainID
            );
            deposits.push(
              await parseDeposit(
                log,
                thisDomain,
                toDomain!,
                provider,
                substrateRpcUrlConfig
              )
            );
          } else if (log.topics[0] === bridge.events.ProposalExecution.topic) {
            executions.push(parseProposalExecution(log, thisDomain));
          } else if (
            log.topics[0] === bridge.events.FailedHandlerExecution.topic
          ) {
            failedHandlerExecutions.push(
              parseFailedHandlerExecution(log, thisDomain)
            );
          }
        }
      }

      await processDeposits(ctx, deposits);
      await processExecutions(ctx, executions);
      await processFailedExecutions(ctx, failedHandlerExecutions);
    }
  );
}

startEVMProcessing()
  .then(() => {
    logger.info("Processing completed successfully.");
  })
  .catch((error) => {
    logger.error("An error occurred during processing:", error);
  });
