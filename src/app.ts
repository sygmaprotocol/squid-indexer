/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import cors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import fastify from "fastify";
import type { FastifyInstance } from "fastify";
import fastifyHealthcheck from "fastify-healthcheck";
import plugin from "typeorm-fastify-plugin";

import { routes } from "./routes";
import { AppDataSource } from "./utils";

export const app: FastifyInstance = fastify({ logger: true });
void app.register(cors, {
  origin: "*", // in the meantime
});

void app.register(fastifyHealthcheck, {
  healthcheckUrl: "/health",
  exposeUptime: true,
  underPressureOptions: {
    healthCheckInterval: 5000,
    // eslint-disable-next-line @typescript-eslint/require-await
    healthCheck: async () => {
      return true;
    },
  },
});

void app.register(fastifySwagger, {
  mode: "dynamic",
  openapi: {
    openapi: "3.0.0",
    info: {
      title: "Transfers API",
      version: "1.0.0",
      description: "API documentation for Transfers API",
    },
  },
});

void app.register(fastifySwaggerUi, {
  routePrefix: "/documentation",
  uiConfig: {
    docExpansion: "list",
  },
  staticCSP: true,
});

void app.register(plugin, { connection: AppDataSource });

void app.register(routes, { prefix: "/api" });
