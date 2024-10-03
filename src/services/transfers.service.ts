/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type { FindOptionsWhere, Repository } from "typeorm";

import type { TransferStatus } from "../model";
import { Deposit, Transfer } from "../model";
import { AppDataSource, getTransferQueryParams, NotFound } from "../utils";

export type Pagination = {
  page: number;
  limit: number;
};

export enum DomainType {
  Source = "source",
  Destination = "destination",
}

class TransfersService {
  private transfersRepository: Repository<Transfer>;
  private depositRepository: Repository<Deposit>;
  constructor() {
    this.transfersRepository = AppDataSource.getRepository(Transfer);
    this.depositRepository = AppDataSource.getRepository(Deposit);
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
      relations: [
        "resource",
        "toDomain",
        "fromDomain",
        "fee",
        "deposit",
        "execution",
        "account",
      ],
      select: { ...getTransferQueryParams() },
    });

    return transfers;
  }

  public async findAllTransfers(
    status: TransferStatus | undefined,
    paginationParams: Pagination,
  ): Promise<Transfer[]> {
    const where: FindOptionsWhere<Transfer> = {
      status: status,
    };

    const transfers = this.findTransfers(where, paginationParams);

    return transfers;
  }

  public async findTransferById(id: string): Promise<Transfer> {
    const transfer = await this.transfersRepository.findOne({
      where: { id },
      relations: [
        "resource",
        "toDomain",
        "fromDomain",
        "fee",
        "deposit",
        "execution",
        "account",
      ],
      select: { ...getTransferQueryParams() },
    });

    if (!transfer) throw new NotFound("Transfer not found");
    return transfer;
  }

  public async findTransfersByTxHash(
    txHash: string,
    domainID: number,
  ): Promise<Transfer[]> {
    let where: FindOptionsWhere<Deposit>;

    if (domainID === undefined) {
      where = { txHash: txHash };
    } else {
      where = {
        txHash: txHash,
        transfer: {
          fromDomainID: domainID,
        },
      };
    }

    const deposits = await this.depositRepository.find({
      where,
      relations: [
        "transfer",
        "transfer.resource",
        "transfer.toDomain",
        "transfer.fromDomain",
        "transfer.fee",
        "transfer.deposit",
        "transfer.execution",
        "transfer.account",
      ],
    });

    if (!deposits || deposits.length === 0) {
      throw new NotFound("Transfer not found");
    }

    const transfers = deposits.map((deposit) => deposit.transfer!);

    return transfers;
  }

  public async findTransfersByAccountAddress(
    sender: string,
    status: TransferStatus | undefined,
    paginationParams: Pagination,
  ): Promise<Transfer[]> {
    const where: FindOptionsWhere<Transfer> = {
      accountID: sender,
      status: status,
    };

    const transfers = this.findTransfers(where, paginationParams);

    return transfers;
  }

  public async findTransfersByResourceID(
    resourceID: string,
    status: TransferStatus | undefined,
    paginationParams: Pagination,
  ): Promise<Transfer[]> {
    const where: FindOptionsWhere<Transfer> = {
      resourceID: resourceID,
      status: status,
    };

    const transfers = this.findTransfers(where, paginationParams);

    return transfers;
  }

  public async findTransfersBySourceDomainToDestinationDomain(
    sourceDomainID: number,
    destinationDomainID: number,
    paginationParams: Pagination,
  ): Promise<Transfer[]> {
    const where: FindOptionsWhere<Transfer> = {
      fromDomainID: sourceDomainID,
      toDomainID: destinationDomainID,
    };

    const transfers = this.findTransfers(where, paginationParams);

    return transfers;
  }

  public async findTransfersByResourceBetweenDomains(
    resourceID: string,
    sourceDomainID: number,
    destinationDomainID: number,
    paginationParams: Pagination,
  ): Promise<Transfer[]> {
    const where: FindOptionsWhere<Transfer> = {
      resourceID: resourceID,
      fromDomainID: sourceDomainID,
      toDomainID: destinationDomainID,
    };

    const transfers = this.findTransfers(where, paginationParams);

    return transfers;
  }

  public async findTransfersByDomain(
    domainID: number,
    domain: DomainType,
    status: TransferStatus | undefined,
    paginationParams: Pagination,
  ): Promise<Transfer[]> {
    let where: FindOptionsWhere<Transfer> | FindOptionsWhere<Transfer>[];

    if (domain == DomainType.Source) {
      where = { fromDomainID: domainID, status: status };
    } else if (domain == DomainType.Destination) {
      where = { toDomainID: domainID, status: status };
    } else {
      where = [
        { fromDomainID: domainID, status: status },
        { toDomainID: domainID, status: status },
      ];
    }

    const transfers = this.findTransfers(where, paginationParams);

    return transfers;
  }
}
export default TransfersService;
