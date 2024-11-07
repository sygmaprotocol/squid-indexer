import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"
import {Transfer} from "./transfer.model"

@Entity_()
export class Execution {
    constructor(props?: Partial<Execution>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string


    @Column_("text", {nullable: false})
    txHash!: string

    @Column_("timestamp with time zone", {nullable: true})
    timestamp!: Date | undefined | null

    @Column_("text", {nullable: false})
    blockNumber!: string

    @Column_("text", {nullable: true})
    message!: string | undefined | null
}
