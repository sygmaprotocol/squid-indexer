/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import {
  Entity as Entity_,
  Column as Column_,
  PrimaryColumn as PrimaryColumn_,
  ManyToOne as ManyToOne_,
  Index as Index_,
  OneToOne as OneToOne_,
  JoinColumn as JoinColumn_,
} from "typeorm";
import * as marshal from "./marshal";
import { Resource } from "./resource.model";
import { Domain } from "./domain.model";
import { TransferStatus } from "./_transferStatus";
import { Deposit } from "./deposit.model";
import { Execution } from "./execution.model";
import { Fee } from "./fee.model";
import { Account } from "./account.model";

@Entity_()
export class Transfer {
  constructor(props?: Partial<Transfer>) {
    Object.assign(this, props);
  }

  @PrimaryColumn_()
  id!: string;

  @Column_("numeric", {
    transformer: marshal.bigintTransformer,
    nullable: false,
  })
  depositNonce!: bigint;

  @Index_()
  @ManyToOne_(() => Resource, { nullable: true })
  resource!: Resource | undefined | null;

  @Column_("text", { nullable: true })
  resourceID!: string | undefined | null;

  @Index_()
  @ManyToOne_(() => Domain, { nullable: true })
  fromDomain!: Domain;

  @Column_("int4", { nullable: false })
  fromDomainID!: number;

  @Index_()
  @ManyToOne_(() => Domain, { nullable: true })
  toDomain!: Domain | undefined | null;

  @Column_("int4", { nullable: true })
  toDomainID!: number | undefined | null;

  @Column_("text", { nullable: true })
  destination!: string | undefined | null;

  @Column_("text", { nullable: true })
  amount!: string | undefined | null;

  @Column_("varchar", { length: 8, nullable: false })
  status!: TransferStatus;

  @Index_({ unique: true })
  @OneToOne_(() => Deposit, { nullable: true })
  @JoinColumn_()
  deposit!: Deposit | undefined | null;

  @Index_({ unique: true })
  @OneToOne_(() => Execution, { nullable: true })
  @JoinColumn_()
  execution!: Execution | undefined | null;

  @Index_({ unique: true })
  @OneToOne_(() => Fee, { nullable: true })
  @JoinColumn_()
  fee!: Fee | undefined | null;

  @Index_()
  @ManyToOne_(() => Account, { nullable: true })
  account!: Account | undefined | null;

  @Column_("text", { nullable: true })
  message!: string | undefined | null;

  @Column_("numeric", { transformer: marshal.floatTransformer, nullable: true })
  usdValue!: number | undefined | null;
}
