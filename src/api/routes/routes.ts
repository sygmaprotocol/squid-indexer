/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type { FastifyInstance } from "fastify";

import { DomainsController } from "../controllers/DomainController";
import { RoutesController } from "../controllers/RoutesController";
import { TransfersController } from "../controllers/TransfersController";
import {
  domainsMetadataSchema,
  resourcesByDomainSchema,
  routesByDomainSchema,
  transferByIdSchema,
  transferByTxHashAndDomainSchema,
  transfersByDomainSchema,
  transfersByResourceBetweenDomainsSchema,
  transfersByResourceSchema,
  transfersBySenderSchema,
  transfersBySourceDomainToDestinationDomainSchema,
  transfersSchema,
} from "../controllers/schemas";

// eslint-disable-next-line @typescript-eslint/require-await
export async function routes(fastify: FastifyInstance): Promise<void> {
  fastify.route({
    method: "GET",
    url: "/transfers",
    schema: transfersSchema,
    handler: TransfersController.transfers,
  });

  fastify.route({
    method: "GET",
    url: "/transfers/:id",
    schema: transferByIdSchema,
    handler: TransfersController.transferById,
  });

  fastify.route({
    method: "GET",
    url: "/transfers/txHash/:txHash",
    schema: transferByTxHashAndDomainSchema,
    handler: TransfersController.transferByTxHash,
  });

  fastify.route({
    method: "GET",
    url: "/sender/:senderAddress/transfers",
    schema: transfersBySenderSchema,
    handler: TransfersController.transfersBySender,
  });

  fastify.route({
    method: "GET",
    url: "/resources/:resourceID/transfers",
    schema: transfersByResourceSchema,
    handler: TransfersController.transfersByResource,
  });

  fastify.route({
    method: "GET",
    url: "/domains/source/:sourceDomainID/destination/:destinationDomainID/transfers",
    schema: transfersBySourceDomainToDestinationDomainSchema,
    handler: TransfersController.transfersBySourceDomainToDestinationDomain,
  });

  fastify.route({
    method: "GET",
    url: "/resources/:resourceID/domains/source/:sourceDomainID/destination/:destinationDomainID/transfers",
    schema: transfersByResourceBetweenDomainsSchema,
    handler: TransfersController.transfersByResourceBetweenDomains,
  });

  fastify.route({
    method: "GET",
    url: "/domains/:domainID/transfers",
    schema: transfersByDomainSchema,
    handler: TransfersController.transfersByDomain,
  });

  fastify.route({
    method: "GET",
    url: "/domains/metadata",
    schema: domainsMetadataSchema,
    handler: DomainsController.domainsMetadata,
  });

  fastify.route({
    method: "GET",
    url: "/routes/from/:domainID",
    schema: routesByDomainSchema,
    handler: RoutesController.routes,
  });

  fastify.route({
    method: "GET",
    url: "/domains/:domainID/resources",
    schema: resourcesByDomainSchema,
    handler: DomainsController.resources,
  });
}