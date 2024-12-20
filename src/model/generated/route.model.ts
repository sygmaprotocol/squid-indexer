/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, StringColumn as StringColumn_, ManyToOne as ManyToOne_, OneToMany as OneToMany_} from "@subsquid/typeorm-store"
import {Domain} from "./domain.model"
import {Resource} from "./resource.model"
import {Transfer} from "./transfer.model"
import { PrimaryGeneratedColumn } from "typeorm"

@Index_(["fromDomainID", "toDomainID", "resourceID"], {unique: true})
@Entity_()
export class Route {
    constructor(props?: Partial<Route>) {
        Object.assign(this, props)
    }

    @PrimaryGeneratedColumn("uuid")
    id!: string

    @StringColumn_({nullable: true})
    fromDomainID!: string | undefined | null

    @Index_()
    @ManyToOne_(() => Domain, {nullable: true})
    fromDomain!: Domain

    @StringColumn_({nullable: true})
    toDomainID!: string | undefined | null

    @Index_()
    @ManyToOne_(() => Domain, {nullable: true})
    toDomain!: Domain

    @StringColumn_({nullable: true})
    resourceID!: string | undefined | null

    @Index_()
    @ManyToOne_(() => Resource, {nullable: true})
    resource!: Resource

    @OneToMany_(() => Transfer, e => e.route)
    transfers!: Transfer[]
}
