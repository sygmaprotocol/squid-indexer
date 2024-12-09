/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import {Deposit} from "./deposit.model"
import {Domain} from "./domain.model"
import {Token} from "./token.model"

@Entity_()
export class Fee {
    constructor(props?: Partial<Fee>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Column_("text", {nullable: false})
    amount!: string

    @Column_("text", {nullable: true})
    depositID!: string | undefined | null

    @Index_()
    @ManyToOne_(() => Deposit, {nullable: true})
    deposit!: Deposit | undefined | null

    @Column_("text", {nullable: true})
    domainID!: string | undefined | null

    @Index_()
    @ManyToOne_(() => Domain, {nullable: true})
    domain!: Domain

    @Index_()
    @ManyToOne_(() => Token, {nullable: true})
    token!: Token | undefined | null

    @Column_("text", {nullable: true})
    tokenID!: string | undefined | null
}
