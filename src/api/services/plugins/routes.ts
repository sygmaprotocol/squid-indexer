/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type { FastifyPluginAsync } from "fastify";

import { registerRoutes } from "../../routes";

export const routesPlugin: FastifyPluginAsync = async function (instance) {
  await registerRoutes(instance);
};
