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
export class Domain {
  constructor(props?: Partial<Domain>) {
    Object.assign(this, props);
  }

  @PrimaryColumn_()
  id!: string;

  @Column_("text", { nullable: false })
  name!: string;

  @Column_("text", { nullable: false })
  lastIndexedBlock!: string;

  @OneToMany_(() => Transfer, (e) => e.fromDomain)
  transfersFrom!: Transfer[];

  @OneToMany_(() => Transfer, (e) => e.toDomain)
  transfersTo!: Transfer[];
}
