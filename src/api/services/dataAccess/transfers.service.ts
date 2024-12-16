/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type { DataSource, FindOptionsWhere, Repository } from "typeorm";

import { Transfer } from "../../../model";

export type Pagination = {
  page: number;
  limit: number;
};

export class TransfersService {
  private transfersRepository: Repository<Transfer>;
  constructor(dataSource: DataSource) {
    this.transfersRepository = dataSource.getRepository(Transfer);
  }

  private calculatePaginationParams(paginationParams: Pagination): {
    skip: number;
    take: number;
  } {
    const pageSize = paginationParams.limit;
    const pageIndex = paginationParams.page;
    const skip = (pageIndex - 1) * pageSize;
    const take = pageSize;

    return {
      skip,
      take,
    };
  }

  public async findTransfers(
    where: FindOptionsWhere<Transfer>,
    paginationParams: Pagination,
  ): Promise<Transfer[]> {
    const { skip, take } = this.calculatePaginationParams(paginationParams);

    const transfers = await this.transfersRepository.find({
      where,
      take,
      skip,
      order: {
        deposit: {
          timestamp: "DESC",
        },
      },
      relations: {
        deposit: true,
        execution: true,
        route: true,
        fee: { token: true },
      },
    });

    return transfers;
  }
}
