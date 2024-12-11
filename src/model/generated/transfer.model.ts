/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_, OneToOne as OneToOne_, JoinColumn as JoinColumn_} from "typeorm"
import {TransferStatus} from "./_transferStatus"
import {Domain} from "./domain.model"
import {Deposit} from "./deposit.model"
import {Execution} from "./execution.model"
import {Fee} from "./fee.model"
import {Resource} from "./resource.model"

@Entity_()
export class Transfer {
    constructor(props?: Partial<Transfer>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Column_("varchar", {length: 8, nullable: false})
    status!: TransferStatus

    @Column_("text", {nullable: false})
    depositNonce!: string

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

    @Index_({unique: true})
    @OneToOne_(() => Deposit, {nullable: true})
    @JoinColumn_()
    deposit!: Deposit | undefined | null

    @Index_({unique: true})
    @OneToOne_(() => Execution, {nullable: true})
    @JoinColumn_()
    execution!: Execution | undefined | null

    @Column_("text", {nullable: true})
    feeID!: string | undefined | null

    @Index_({unique: true})
    @OneToOne_(() => Fee, {nullable: true})
    @JoinColumn_()
    fee!: Fee | undefined | null

    @Index_()
    @ManyToOne_(() => Resource, {nullable: true})
    resource!: Resource | undefined | null

    @Column_("text", {nullable: true})
    resourceID!: string | undefined | null

    @Column_("text", {nullable: true})
    amount!: string | undefined | null
}
