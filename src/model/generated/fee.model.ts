/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import {
  Entity as Entity_,
  Column as Column_,
  PrimaryColumn as PrimaryColumn_,
} from "typeorm";

@Entity_()
export class Fee {
  constructor(props?: Partial<Fee>) {
    Object.assign(this, props);
  }

  @PrimaryColumn_()
  id!: string;

  @Column_("text", { nullable: false })
  amount!: string;

  @Column_("text", { nullable: false })
  tokenAddress!: string;

  @Column_("text", { nullable: false })
  tokenSymbol!: string;

  @Column_("int4", { nullable: true })
  decimals!: number | undefined | null;
}
