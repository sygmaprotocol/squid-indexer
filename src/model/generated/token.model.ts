/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, ManyToOne as ManyToOne_, OneToMany as OneToMany_, PrimaryGeneratedColumn} from "typeorm"
import {Resource} from "./resource.model"
import {Domain} from "./domain.model"
import {Fee} from "./fee.model"

@Index_(["tokenAddress", "domainID"], {unique: true})
@Entity_()
export class Token {
    constructor(props?: Partial<Token>) {
        Object.assign(this, props)
    }

    @PrimaryGeneratedColumn("uuid")
    id!: string

    @Column_("int4", {nullable: false})
    decimals!: number

    @Column_("text", {nullable: false})
    tokenAddress!: string

    @Column_("text", {nullable: false})
    tokenSymbol!: string

    @Index_()
    @ManyToOne_(() => Resource, {nullable: true})
    resource!: Resource | undefined | null

    @Index_()
    @ManyToOne_(() => Domain, {nullable: true})
    domain!: Domain

    @Column_("text", {nullable: true})
    domainID!: string | undefined | null

    @OneToMany_(() => Fee, e => e.token)
    fee!: Fee[]
}
