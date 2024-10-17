/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, IntColumn as IntColumn_, OneToOne as OneToOne_} from "@subsquid/typeorm-store"
import {Transfer} from "./transfer.model"

@Entity_()
export class Fee {
    constructor(props?: Partial<Fee>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @StringColumn_({nullable: false})
    amount!: string

    @StringColumn_({nullable: false})
    tokenAddress!: string

    @StringColumn_({nullable: false})
    tokenSymbol!: string

    @IntColumn_({nullable: true})
    decimals!: number | undefined | null

    @OneToOne_(() => Transfer, e => e.fee)
    transfer!: Transfer | undefined | null
}
