/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import {
  Entity as Entity_,
  Column as Column_,
  PrimaryColumn as PrimaryColumn_,
  OneToMany as OneToMany_,
} from "typeorm";
import { Transfer } from "./transfer.model";

@Entity_()
export class Resource {
  constructor(props?: Partial<Resource>) {
    Object.assign(this, props);
  }

  @PrimaryColumn_()
  id!: string;

  @Column_("text", { nullable: false })
  type!: string;

  @Column_("int4", { nullable: true })
  decimals!: number | undefined | null;

  @OneToMany_(() => Transfer, (e) => e.resource)
  transfers!: Transfer[];
}
