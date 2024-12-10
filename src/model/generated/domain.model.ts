/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToMany as OneToMany_} from "typeorm"
import {Transfer} from "./transfer.model"
import {Token} from "./token.model"

@Entity_()
export class Domain {
    constructor(props?: Partial<Domain>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Column_("text", {nullable: false})
    name!: string

    @OneToMany_(() => Transfer, e => e.fromDomain)
    fromDomain!: Transfer[]

    @OneToMany_(() => Transfer, e => e.toDomain)
    toDomain!: Transfer[]

    @OneToMany_(() => Token, e => e.domain)
    token!: Token[]
}
