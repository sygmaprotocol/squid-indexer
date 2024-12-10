/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, OneToMany as OneToMany_} from "@subsquid/typeorm-store"
import {Deposit} from "./deposit.model"

@Entity_()
export class Account {
    constructor(props?: Partial<Account>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @StringColumn_({nullable: true})
    addressStatus!: string | undefined | null

    @OneToMany_(() => Deposit, e => e.account)
    deposits!: Deposit[]
}
