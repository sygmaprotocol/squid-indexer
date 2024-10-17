/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, BigIntColumn as BigIntColumn_, ManyToOne as ManyToOne_, Index as Index_, StringColumn as StringColumn_, IntColumn as IntColumn_, OneToOne as OneToOne_, JoinColumn as JoinColumn_, FloatColumn as FloatColumn_} from "@subsquid/typeorm-store"
import {Resource} from "./resource.model"
import {Domain} from "./domain.model"
import {TransferStatus} from "./_transferStatus"
import {Deposit} from "./deposit.model"
import {Execution} from "./execution.model"
import {Fee} from "./fee.model"
import {Account} from "./account.model"

@Entity_()
export class Transfer {
    constructor(props?: Partial<Transfer>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @BigIntColumn_({nullable: false})
    depositNonce!: bigint

    @Index_()
    @ManyToOne_(() => Resource, {nullable: true})
    resource!: Resource | undefined | null

    @StringColumn_({nullable: true})
    resourceID!: string | undefined | null

    @Index_()
    @ManyToOne_(() => Domain, {nullable: true})
    fromDomain!: Domain

    @IntColumn_({nullable: false})
    fromDomainID!: number

    @Index_()
    @ManyToOne_(() => Domain, {nullable: true})
    toDomain!: Domain | undefined | null

    @IntColumn_({nullable: true})
    toDomainID!: number | undefined | null

    @StringColumn_({nullable: true})
    destination!: string | undefined | null

    @StringColumn_({nullable: true})
    amount!: string | undefined | null

    @Column_("varchar", {length: 8, nullable: false})
    status!: TransferStatus

    @Index_({unique: true})
    @OneToOne_(() => Deposit, {nullable: true})
    @JoinColumn_()
    deposit!: Deposit | undefined | null

    @Index_({unique: true})
    @OneToOne_(() => Execution, {nullable: true})
    @JoinColumn_()
    execution!: Execution | undefined | null

    @Index_({unique: true})
    @OneToOne_(() => Fee, {nullable: true})
    @JoinColumn_()
    fee!: Fee | undefined | null

    @Index_()
    @ManyToOne_(() => Account, {nullable: true})
    account!: Account | undefined | null

    @StringColumn_({nullable: true})
    accountID!: string | undefined | null

    @StringColumn_({nullable: true})
    message!: string | undefined | null

    @FloatColumn_({nullable: true})
    usdValue!: number | undefined | null
}
