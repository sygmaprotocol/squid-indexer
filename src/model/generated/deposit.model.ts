/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"
import {Transfer} from "./transfer.model"

@Entity_()
export class Deposit {
    constructor(props?: Partial<Deposit>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string


    @Column_("text", {nullable: false})
    type!: string

    @Column_("text", {nullable: false})
    txHash!: string

    @Column_("text", {nullable: false})
    blockNumber!: string

    @Column_("text", {nullable: false})
    depositData!: string

    @Column_("timestamp with time zone", {nullable: true})
    timestamp!: Date | undefined | null

    @Column_("text", {nullable: false})
    handlerResponse!: string
}
