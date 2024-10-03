/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, IntColumn as IntColumn_, OneToMany as OneToMany_} from "@subsquid/typeorm-store"
import {Transfer} from "./transfer.model"

@Entity_()
export class Resource {
    constructor(props?: Partial<Resource>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @StringColumn_({nullable: false})
    type!: string

    @IntColumn_({nullable: true})
    decimals!: number | undefined | null

    @OneToMany_(() => Transfer, e => e.resource)
    transfers!: Transfer[]
}
