/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToOne as OneToOne_, Index as Index_, JoinColumn as JoinColumn_, ManyToOne as ManyToOne_} from "typeorm"
import {Transfer} from "./transfer.model"
import {Fee} from "./fee.model"
import {Account} from "./account.model"
import {Resource} from "./resource.model"
import {Domain} from "./domain.model"

@Entity_()
export class Deposit {
    constructor(props?: Partial<Deposit>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string


    @Column_("text", {nullable: false})
    type!: string

    @Column_("text", {nullable: false})
    txHash!: string

    @Column_("text", {nullable: false})
    blockNumber!: string

    @Column_("text", {nullable: false})
    depositData!: string

    @Column_("timestamp with time zone", {nullable: true})
    timestamp!: Date | undefined | null

    @Column_("text", {nullable: false})
    handlerResponse!: string

    @Column_("text", {nullable: true})
    feeID!: string | undefined | null

    @Index_({unique: true})
    @OneToOne_(() => Fee, {nullable: true})
    @JoinColumn_()
    fee!: Fee | undefined | null

    @Column_("text", {nullable: true})
    accountID!: string | undefined | null

    @Index_()
    @ManyToOne_(() => Account, {nullable: true})
    account!: Account | undefined | null

    @Column_("text", {nullable: true})
    depositNonce!: string | undefined | null

    @Index_()
    @ManyToOne_(() => Resource, {nullable: true})
    resource!: Resource

    @Column_("text", {nullable: true})
    resourceID!: string | undefined | null

    @Column_("text", {nullable: true})
    fromDomainID!: string | undefined | null

    @Index_()
    @ManyToOne_(() => Domain, {nullable: true})
    fromDomain!: Domain

    @Column_("text", {nullable: true})
    toDomainID!: string | undefined | null

    @Index_()
    @ManyToOne_(() => Domain, {nullable: true})
    toDomain!: Domain

    @Column_("text", {nullable: true})
    destination!: string | undefined | null

    @Column_("text", {nullable: false})
    amount!: string
}
