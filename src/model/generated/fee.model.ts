import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import {Resource} from "./resource.model"
import {Deposit} from "./deposit.model"
import {Domain} from "./domain.model"

@Entity_()
export class Fee {
    constructor(props?: Partial<Fee>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Column_("text", {nullable: false})
    amount!: string

    @Column_("text", {nullable: true})
    resourceID!: string | undefined | null

    @Index_()
    @ManyToOne_(() => Resource, {nullable: true})
    resource!: Resource

    @Column_("text", {nullable: true})
    depositID!: string | undefined | null

    @Index_()
    @ManyToOne_(() => Deposit, {nullable: true})
    deposit!: Deposit | undefined | null

    @Column_("text", {nullable: true})
    domainID!: string | undefined | null

    @Index_()
    @ManyToOne_(() => Domain, {nullable: true})
    domain!: Domain
}
