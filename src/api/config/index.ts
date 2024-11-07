/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type { FastifyEnvOptions } from "@fastify/env";

export const config: FastifyEnvOptions = {
  schema: {
    type: "object",
    properties: {
      SERVER_ADDRESS: {
        type: "string",
        default: "0.0.0.0",
      },
      SERVER_PORT: {
        type: "number",
        default: 3000,
      },
      CORS_ORIGIN: {
        type: "string",
        default: "*",
      },
      HEALTHCHECK_INTERVAL: {
        type: "number",
        default: 30000,
      },
      DB_NAME: {
        type: "string",
        default: "squid",
      },
      DB_PASS: {
        type: "string",
        default: "squid",
      },
      DB_PORT: {
        type: "number",
        default: 5432,
      },
      DB_USERNAME: {
        type: "string",
        default: "postgres",
      },
      DB_HOST: {
        type: "string",
        default: "db",
      },
    },
  },
  env: true,
};

declare module "fastify" {
  interface FastifyInstance {
    config: {
      SERVER_ADDRESS: string;
      SERVER_PORT: number;
      CORS_ORIGIN: string;
      HEALTHCHECK_INTERVAL: number;
      DB_NAME: string;
      DB_PASS: string;
      DB_PORT: number;
      DB_USERNAME: string;
      DB_HOST: string;
    };
  }
}
