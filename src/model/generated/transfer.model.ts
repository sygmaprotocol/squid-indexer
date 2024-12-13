/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, OneToOne as OneToOne_, Index as Index_, JoinColumn as JoinColumn_, ManyToOne as ManyToOne_} from "@subsquid/typeorm-store"
import {TransferStatus} from "./_transferStatus"
import {Deposit} from "./deposit.model"
import {Execution} from "./execution.model"
import {Fee} from "./fee.model"
import {Route} from "./route.model"

@Index_(["routeID", "depositNonce"], {unique: true})
@Entity_()
export class Transfer {
    constructor(props?: Partial<Transfer>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Column_("varchar", {length: 8, nullable: false})
    status!: TransferStatus

    @StringColumn_({nullable: false})
    depositNonce!: string

    @Index_({unique: true})
    @OneToOne_(() => Deposit, {nullable: true})
    @JoinColumn_()
    deposit!: Deposit | undefined | null

    @Index_({unique: true})
    @OneToOne_(() => Execution, {nullable: true})
    @JoinColumn_()
    execution!: Execution | undefined | null

    @StringColumn_({nullable: true})
    feeID!: string | undefined | null

    @Index_({unique: true})
    @OneToOne_(() => Fee, {nullable: true})
    @JoinColumn_()
    fee!: Fee | undefined | null

    @StringColumn_({nullable: true})
    routeID!: string | undefined | null

    @Index_()
    @ManyToOne_(() => Route, {nullable: true})
    route!: Route | undefined | null

    @StringColumn_({nullable: true})
    amount!: string | undefined | null
}
