/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, OneToMany as OneToMany_} from "@subsquid/typeorm-store"
import {Deposit} from "./deposit.model"
import {Token} from "./token.model"

@Entity_()
export class Resource {
    constructor(props?: Partial<Resource>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @StringColumn_({nullable: false})
    type!: string

    @OneToMany_(() => Deposit, e => e.resource)
    deposit!: Deposit[]

    @OneToMany_(() => Token, e => e.resource)
    tokens!: Token[]
}
