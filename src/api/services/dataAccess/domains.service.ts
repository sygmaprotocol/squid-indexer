/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type { DataSource, FindOptionsWhere, Repository } from "typeorm";

import { Domain } from "../../../model";

export class DomainsService {
  private domainRepository: Repository<Domain>;
  constructor(dataSource: DataSource) {
    this.domainRepository = dataSource.getRepository(Domain);
  }

  public async findDomains(where: FindOptionsWhere<Domain>): Promise<Domain[]> {
    const routes = await this.domainRepository.find({
      where,
      order: {
        id: "ASC",
      },
    });
    return routes;
  }
}
