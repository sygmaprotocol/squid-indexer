/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToMany as OneToMany_} from "typeorm"
import {Deposit} from "./deposit.model"
import {Fee} from "./fee.model"
import {Resource} from "./resource.model"

@Entity_()
export class Domain {
    constructor(props?: Partial<Domain>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Column_("text", {nullable: false})
    name!: string

    @OneToMany_(() => Deposit, e => e.fromDomain)
    fromDomain!: Deposit[]

    @OneToMany_(() => Deposit, e => e.toDomain)
    toDomain!: Deposit[]

    @OneToMany_(() => Fee, e => e.domain)
    fee!: Fee[]

    @OneToMany_(() => Resource, e => e.domain)
    resource!: Resource[]
}
