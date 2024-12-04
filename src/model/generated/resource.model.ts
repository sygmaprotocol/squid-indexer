import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, OneToMany as OneToMany_, ManyToOne as ManyToOne_, PrimaryGeneratedColumn} from "typeorm"
import {Deposit} from "./deposit.model"
import {Domain} from "./domain.model"

@Index_(["tokenAddress", "domainID"], {unique: true})
@Entity_()
export class Resource {
    constructor(props?: Partial<Resource>) {
        Object.assign(this, props)
    }

    @PrimaryGeneratedColumn("uuid")
    id!: string

    @Column_("text", {nullable: false})
    resourceID!: string

    @Column_("text", {nullable: false})
    type!: string

    @Column_("int4", {nullable: true})
    decimals!: number | undefined | null

    @Column_("text", {nullable: false})
    tokenAddress!: string

    @Column_("text", {nullable: false})
    tokenSymbol!: string

    @OneToMany_(() => Deposit, e => e.resource)
    deposit!: Deposit[]

    @Column_("text", {nullable: true})
    domainID!: string | undefined | null

    @Index_()
    @ManyToOne_(() => Domain, {nullable: true})
    domain!: Domain | undefined | null
}
