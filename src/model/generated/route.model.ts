/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import {Entity as Entity_, Column as Column_, Index as Index_, ManyToOne as ManyToOne_, PrimaryGeneratedColumn} from "typeorm"
import {Domain} from "./domain.model"

@Index_(["fromDomainID", "toDomainID", "resourceID"], {unique: true})
@Entity_()
export class Route {
    constructor(props?: Partial<Route>) {
        Object.assign(this, props)
    }

    @PrimaryGeneratedColumn("uuid")
    id!: string

    @Column_("text", {nullable: true})
    fromDomainID!: string | undefined | null

    @Index_()
    @ManyToOne_(() => Domain, {nullable: true})
    fromDomain!: Domain | undefined | null

    @Column_("text", {nullable: true})
    toDomainID!: string | undefined | null

    @Index_()
    @ManyToOne_(() => Domain, {nullable: true})
    toDomain!: Domain | undefined | null

    @Column_("text", {nullable: true})
    resourceID!: string | undefined | null
}
