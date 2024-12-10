/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, IntColumn as IntColumn_, StringColumn as StringColumn_, ManyToOne as ManyToOne_, OneToMany as OneToMany_} from "@subsquid/typeorm-store"
import {Resource} from "./resource.model"
import {Domain} from "./domain.model"
import {Fee} from "./fee.model"
import { PrimaryGeneratedColumn } from "typeorm"

@Index_(["tokenAddress", "domainID"], {unique: true})
@Entity_()
export class Token {
    constructor(props?: Partial<Token>) {
        Object.assign(this, props)
    }

    @PrimaryGeneratedColumn("uuid")
    id!: string

    @IntColumn_({nullable: false})
    decimals!: number

    @StringColumn_({nullable: false})
    tokenAddress!: string

    @StringColumn_({nullable: false})
    tokenSymbol!: string

    @Index_()
    @ManyToOne_(() => Resource, {nullable: true})
    resource!: Resource | undefined | null

    @StringColumn_({nullable: true})
    resourceID!: string | undefined | null

    @Index_()
    @ManyToOne_(() => Domain, {nullable: true})
    domain!: Domain

    @StringColumn_({nullable: true})
    domainID!: string | undefined | null

    @OneToMany_(() => Fee, e => e.token)
    fee!: Fee[]
}
