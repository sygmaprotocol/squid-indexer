/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import { Environment } from "@buildwithsygma/sygma-sdk-core";

import { routesMainnet } from "../routes/routes.mainnet";
import { routesTestnet } from "../routes/routes.testnet";
import type { Route } from "../routes/types";

export class RoutesService {
  private readonly routes;
  constructor(env: Environment) {
    if (env === Environment.MAINNET) {
      this.routes = routesMainnet;
    } else {
      this.routes = routesTestnet;
    }
  }
  public getAllRoutes(from: string, resourceType: string): Route[] {
    const allRoutes: Route[] = this.routes.get(from) || [];
    if (resourceType === "any") {
      return allRoutes;
    } else {
      return allRoutes.filter((route) => route.type == resourceType);
    }
  }
}
