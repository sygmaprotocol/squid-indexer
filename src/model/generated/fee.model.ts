/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, ManyToOne as ManyToOne_, Index as Index_} from "@subsquid/typeorm-store"
import {Resource} from "./resource.model"
import {Deposit} from "./deposit.model"
import {Domain} from "./domain.model"

@Entity_()
export class Fee {
    constructor(props?: Partial<Fee>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @StringColumn_({nullable: false})
    amount!: string

    @StringColumn_({nullable: true})
    resourceID!: string | undefined | null

    @Index_()
    @ManyToOne_(() => Resource, {nullable: true})
    resource!: Resource

    @StringColumn_({nullable: true})
    depositID!: string | undefined | null

    @Index_()
    @ManyToOne_(() => Deposit, {nullable: true})
    deposit!: Deposit | undefined | null

    @StringColumn_({nullable: true})
    domainID!: string | undefined | null

    @Index_()
    @ManyToOne_(() => Domain, {nullable: true})
    domain!: Domain
}
