/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type { DataSource, FindOptionsWhere, Repository } from "typeorm";

import { Route } from "../../../model";

export class RoutesService {
  private routeRepository: Repository<Route>;
  constructor(dataSource: DataSource) {
    this.routeRepository = dataSource.getRepository(Route);
  }

  public async findRoutes(where: FindOptionsWhere<Route>): Promise<Route[]> {
    const routes = await this.routeRepository.find({
      where,
      order: {
        fromDomainID: "ASC",
        toDomainID: "ASC",
        resourceID: "ASC",
      },
      relations: {
        fromDomain: true,
        toDomain: true,
        resource: true,
      },
    });

    return routes;
  }
}
