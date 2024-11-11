import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToOne as OneToOne_, Index as Index_, JoinColumn as JoinColumn_} from "typeorm"
import {TransferStatus} from "./_transferStatus"
import {Deposit} from "./deposit.model"
import {Execution} from "./execution.model"

@Entity_()
export class Transfer {
    constructor(props?: Partial<Transfer>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Column_("varchar", {length: 8, nullable: false})
    status!: TransferStatus

    @Index_({unique: true})
    @OneToOne_(() => Deposit, {nullable: true})
    @JoinColumn_()
    deposit!: Deposit | undefined | null

    @Index_({unique: true})
    @OneToOne_(() => Execution, {nullable: true})
    @JoinColumn_()
    execution!: Execution | undefined | null
}
