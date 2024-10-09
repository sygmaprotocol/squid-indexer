/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import { Environment } from "@buildwithsygma/sygma-sdk-core";
import type { FastifyReply, FastifyRequest } from "fastify";

import { logger } from "../../utils/logger";
import { DomainMetadataConfig } from "../utils/domainMetadata";
import { ResourcesMetadataConfig } from "../utils/resourcesMetadata";

const env = process.env.ENVIRONMENT || "";
const environment = (env.toLowerCase() as Environment) || Environment.MAINNET;
export const DomainsController = {
  domainsMetadata: function (
    request: FastifyRequest<Record<string, never>>,
    reply: FastifyReply,
  ): void {
    const metadata = DomainMetadataConfig[environment];
    if (metadata) {
      void reply.status(200).send(JSON.stringify(metadata));
    } else {
      logger.error(`Unable to find metadata for environment ${environment}`);
      void reply.status(404);
    }
  },
  resources: function (
    request: FastifyRequest<{ Params: { domainID: string } }>,
    reply: FastifyReply,
  ): void {
    const {
      params: { domainID },
    } = request;
    const resources = ResourcesMetadataConfig[environment]!;

    if (!resources) {
      logger.error(`Unable to find resources metadata for ${environment}`);
      void reply.status(404);
    } else {
      void reply.status(200).send(resources[parseInt(domainID)]);
    }
  },
};
