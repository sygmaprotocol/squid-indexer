import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToMany as OneToMany_} from "typeorm"
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

    @Column_("text", {nullable: false})
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
