import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToMany as OneToMany_} from "typeorm"
import {Deposit} from "./deposit.model"
import {Fee} from "./fee.model"
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

    @OneToMany_(() => Deposit, e => e.fromDomain)
    fromDomain!: Deposit[]

    @OneToMany_(() => Deposit, e => e.toDomain)
    toDomain!: Deposit[]

    @OneToMany_(() => Fee, e => e.domain)
    fee!: Fee[]

    @OneToMany_(() => Token, e => e.domain)
    token!: Token[]
}
