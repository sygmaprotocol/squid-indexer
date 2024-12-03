/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, StringColumn as StringColumn_, IntColumn as IntColumn_, OneToMany as OneToMany_, ManyToOne as ManyToOne_} from "@subsquid/typeorm-store"
import {Deposit} from "./deposit.model"
import {Domain} from "./domain.model"
import { PrimaryGeneratedColumn } from "typeorm"

@Index_(["tokenAddress", "domainID"], {unique: true})
@Entity_()
export class Resource {
    constructor(props?: Partial<Resource>) {
        Object.assign(this, props)
    }

    @PrimaryGeneratedColumn("uuid")
    id!: string

    @StringColumn_({nullable: false})
    resourceID!: string

    @StringColumn_({nullable: false})
    type!: string

    @IntColumn_({nullable: true})
    decimals!: number | undefined | null

    @StringColumn_({nullable: false})
    tokenAddress!: string

    @StringColumn_({nullable: false})
    tokenSymbol!: string

    @OneToMany_(() => Deposit, e => e.resource)
    deposit!: Deposit[]

    @StringColumn_({nullable: true})
    domainID!: string | undefined | null

    @Index_()
    @ManyToOne_(() => Domain, {nullable: true})
    domain!: Domain | undefined | null
}
