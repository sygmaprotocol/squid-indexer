/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type { DataSource, FindOptionsWhere, Repository } from "typeorm";

import type { TransferStatus } from "../../../model";
import { Deposit, Transfer } from "../../../model";
import { getTransferQueryParams } from "../utils";

export type Pagination = {
  page: number;
  limit: number;
};

export class TransfersService {
  private transfersRepository: Repository<Transfer>;
  private depositRepository: Repository<Deposit>;
  constructor(dataSource: DataSource) {
    this.transfersRepository = dataSource.getRepository(Transfer);
    this.depositRepository = dataSource.getRepository(Deposit);
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
    where: FindOptionsWhere<Transfer> | FindOptionsWhere<Transfer>[],
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
      relations: ["deposit", "execution"],
      select: { ...getTransferQueryParams() },
    });

    return transfers;
  }

  public async findTransfersByTxHash(
    txHash: string,
    domainID: number,
    paginationParams: Pagination,
  ): Promise<Transfer[]> {
    let where: FindOptionsWhere<Transfer>;

    if (domainID === undefined) {
      where = { deposit: { txHash: txHash } };
    } else {
      where = {
        deposit: {
          txHash: txHash,
          //fromDomainID: domainID,
        },
      };
    }

    const transfers = this.findTransfers(where, paginationParams);

    return transfers;
  }

  public async findTransfersBySenderAddress(
    sender: string,
    status: TransferStatus | undefined,
    paginationParams: Pagination,
  ): Promise<Transfer[]> {
    const where: FindOptionsWhere<Transfer> = {
      deposit: {
        //accountID: sender,
      },
      status: status,
    };

    const transfers = this.findTransfers(where, paginationParams);

    return transfers;
  }
}
