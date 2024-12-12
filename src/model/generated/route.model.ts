/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import {Entity as Entity_, PrimaryColumn as PrimaryColumn_, Index as Index_, StringColumn as StringColumn_, ManyToOne as ManyToOne_} from "@subsquid/typeorm-store"
import {Domain} from "./domain.model"

@Index_(["fromDomainID", "toDomainID", "resourceID"], {unique: true})
@Entity_()
export class Route {
    constructor(props?: Partial<Route>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @StringColumn_({nullable: true})
    fromDomainID!: string | undefined | null

    @Index_()
    @ManyToOne_(() => Domain, {nullable: true})
    fromDomain!: Domain | undefined | null

    @StringColumn_({nullable: true})
    toDomainID!: string | undefined | null

    @Index_()
    @ManyToOne_(() => Domain, {nullable: true})
    toDomain!: Domain | undefined | null

    @StringColumn_({nullable: true})
    resourceID!: string | undefined | null
}
