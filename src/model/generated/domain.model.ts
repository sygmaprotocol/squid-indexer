/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, OneToMany as OneToMany_} from "@subsquid/typeorm-store"
import {Transfer} from "./transfer.model"
import {Route} from "./route.model"
import {Token} from "./token.model"

@Entity_()
export class Domain {
    constructor(props?: Partial<Domain>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @StringColumn_({nullable: false})
    name!: string

    @OneToMany_(() => Transfer, e => e.fromDomain)
    transfersFrom!: Transfer[]

    @OneToMany_(() => Transfer, e => e.toDomain)
    transfersTo!: Transfer[]

    @OneToMany_(() => Route, e => e.fromDomain)
    fromDomain!: Route[]

    @OneToMany_(() => Route, e => e.toDomain)
    toDomain!: Route[]

    @OneToMany_(() => Token, e => e.domain)
    token!: Token[]
}
