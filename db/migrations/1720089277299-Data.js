/*
 * The Licensed Work is (c) 2024 Sygma
 * SPDX-License-Identifier: LGPL-3.0-only
 */
module.exports = class Data1720089277299 {
    name = 'Data1720089277299'

    async up(db) {
        await db.query(`CREATE TABLE "resource" ("id" character varying NOT NULL, "type" text NOT NULL, "decimals" integer, CONSTRAINT "PK_e2894a5867e06ae2e8889f1173f" PRIMARY KEY ("id"))`)
        await db.query(`CREATE TABLE "domain" ("id" character varying NOT NULL, "name" text NOT NULL, "last_indexed_block" text NOT NULL, CONSTRAINT "PK_27e3ec3ea0ae02c8c5bceab3ba9" PRIMARY KEY ("id"))`)
        await db.query(`CREATE TABLE "deposit" ("id" character varying NOT NULL, "type" text NOT NULL, "tx_hash" text NOT NULL, "block_number" text NOT NULL, "deposit_data" text NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE, "handler_response" text NOT NULL, CONSTRAINT "PK_6654b4be449dadfd9d03a324b61" PRIMARY KEY ("id"))`)
        await db.query(`CREATE TABLE "execution" ("id" character varying NOT NULL, "tx_hash" text NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE, "block_number" text NOT NULL, CONSTRAINT "PK_cc6684fedf29ec4c86db8448a2b" PRIMARY KEY ("id"))`)
        await db.query(`CREATE TABLE "fee" ("id" character varying NOT NULL, "amount" text NOT NULL, "token_address" text NOT NULL, "token_symbol" text NOT NULL, "decimals" integer, CONSTRAINT "PK_ee7e51cc563615bc60c2b234635" PRIMARY KEY ("id"))`)
        await db.query(`CREATE TABLE "account" ("id" character varying NOT NULL, "address_status" text, CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea" PRIMARY KEY ("id"))`)
        await db.query(`CREATE TABLE "transfer" ("id" character varying NOT NULL, "deposit_nonce" numeric NOT NULL, "resource_id" character varying, "from_domain_id" character varying NOT NULL, "to_domain_id" character varying, "destination" text, "amount" text, "status" character varying(8) NOT NULL, "message" text, "usd_value" numeric, "deposit_id" character varying, "execution_id" character varying, "fee_id" character varying, "account_id" character varying, CONSTRAINT "REL_0832a6ad200eac838da26a9961" UNIQUE ("deposit_id"), CONSTRAINT "REL_4b62ae14edfb27605cd911db59" UNIQUE ("execution_id"), CONSTRAINT "REL_f6b9e9b86a1ce51c26cd08f596" UNIQUE ("fee_id"), CONSTRAINT "PK_fd9ddbdd49a17afcbe014401295" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_d508a1e7a2e0da07bd955f76d8" ON "transfer" ("resource_id") `)
        await db.query(`CREATE INDEX "IDX_de485b5ed6e047f65e219eb9e9" ON "transfer" ("from_domain_id") `)
        await db.query(`CREATE INDEX "IDX_2803ca6ca9e4443766093ff49b" ON "transfer" ("to_domain_id") `)
        await db.query(`CREATE UNIQUE INDEX "IDX_0832a6ad200eac838da26a9961" ON "transfer" ("deposit_id") `)
        await db.query(`CREATE UNIQUE INDEX "IDX_4b62ae14edfb27605cd911db59" ON "transfer" ("execution_id") `)
        await db.query(`CREATE UNIQUE INDEX "IDX_f6b9e9b86a1ce51c26cd08f596" ON "transfer" ("fee_id") `)
        await db.query(`CREATE INDEX "IDX_bc8d11fdb46573269220c45af5" ON "transfer" ("account_id") `)
        await db.query(`ALTER TABLE "transfer" ADD CONSTRAINT "FK_d508a1e7a2e0da07bd955f76d81" FOREIGN KEY ("resource_id") REFERENCES "resource"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "transfer" ADD CONSTRAINT "FK_de485b5ed6e047f65e219eb9e90" FOREIGN KEY ("from_domain_id") REFERENCES "domain"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "transfer" ADD CONSTRAINT "FK_2803ca6ca9e4443766093ff49bf" FOREIGN KEY ("to_domain_id") REFERENCES "domain"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "transfer" ADD CONSTRAINT "FK_0832a6ad200eac838da26a99615" FOREIGN KEY ("deposit_id") REFERENCES "deposit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "transfer" ADD CONSTRAINT "FK_4b62ae14edfb27605cd911db591" FOREIGN KEY ("execution_id") REFERENCES "execution"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "transfer" ADD CONSTRAINT "FK_f6b9e9b86a1ce51c26cd08f596a" FOREIGN KEY ("fee_id") REFERENCES "fee"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "transfer" ADD CONSTRAINT "FK_bc8d11fdb46573269220c45af52" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    }

    async down(db) {
        await db.query(`DROP TABLE "resource"`)
        await db.query(`DROP TABLE "domain"`)
        await db.query(`DROP TABLE "deposit"`)
        await db.query(`DROP TABLE "execution"`)
        await db.query(`DROP TABLE "fee"`)
        await db.query(`DROP TABLE "account"`)
        await db.query(`DROP TABLE "transfer"`)
        await db.query(`DROP INDEX "public"."IDX_d508a1e7a2e0da07bd955f76d8"`)
        await db.query(`DROP INDEX "public"."IDX_de485b5ed6e047f65e219eb9e9"`)
        await db.query(`DROP INDEX "public"."IDX_2803ca6ca9e4443766093ff49b"`)
        await db.query(`DROP INDEX "public"."IDX_0832a6ad200eac838da26a9961"`)
        await db.query(`DROP INDEX "public"."IDX_4b62ae14edfb27605cd911db59"`)
        await db.query(`DROP INDEX "public"."IDX_f6b9e9b86a1ce51c26cd08f596"`)
        await db.query(`DROP INDEX "public"."IDX_bc8d11fdb46573269220c45af5"`)
        await db.query(`ALTER TABLE "transfer" DROP CONSTRAINT "FK_d508a1e7a2e0da07bd955f76d81"`)
        await db.query(`ALTER TABLE "transfer" DROP CONSTRAINT "FK_de485b5ed6e047f65e219eb9e90"`)
        await db.query(`ALTER TABLE "transfer" DROP CONSTRAINT "FK_2803ca6ca9e4443766093ff49bf"`)
        await db.query(`ALTER TABLE "transfer" DROP CONSTRAINT "FK_0832a6ad200eac838da26a99615"`)
        await db.query(`ALTER TABLE "transfer" DROP CONSTRAINT "FK_4b62ae14edfb27605cd911db591"`)
        await db.query(`ALTER TABLE "transfer" DROP CONSTRAINT "FK_f6b9e9b86a1ce51c26cd08f596a"`)
        await db.query(`ALTER TABLE "transfer" DROP CONSTRAINT "FK_bc8d11fdb46573269220c45af52"`)
    }
}
