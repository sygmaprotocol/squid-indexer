/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import { expect } from "chai"
import sinon from "sinon"
import { getUpdatedTransfer } from "../../src/evmIndexer/utils"
import { Context } from "../../src/evmProcessor"
import { Transfer, TransferStatus } from "../../src/model"
import { toBigInt } from "ethers"

describe("Get updated transfer", function () {
    let ctx: Context;
    let storeStub: sinon.SinonStub;

    beforeEach(() => {
        storeStub = sinon.stub();
    
        ctx = {
          store: {
            findOne: storeStub,
          },
        } as unknown as Context;

    });

    afterEach(() => {
        sinon.restore();
    });

    it("should update an existing transfer", async function () {

        const transferValues: Partial<Transfer> = {
            depositNonce: toBigInt(123),
            fromDomainID: 1, 
            toDomainID: 2, 
            fromDomain: {id: "1", name: "testDomain", lastIndexedBlock: "0", transfersFrom: [], transfersTo: []},
            status: TransferStatus.pending,
            accountID: "0x1"
        }

        const expectedTransfer: Transfer = {
            depositNonce: toBigInt(123),
            fromDomainID: 1,
            toDomainID: 2,
            id: "",
            fromDomain: {id: "1", name: "testDomain", lastIndexedBlock: "0", transfersFrom: [], transfersTo: []},
            status: TransferStatus.pending,
            accountID: "0x1",
            resource: undefined,
            resourceID: undefined,
            toDomain: undefined,
            destination: undefined,
            amount: undefined,
            deposit: undefined,
            execution: undefined,
            fee: undefined,
            account: undefined,
            message: undefined,
            usdValue: undefined
        }

        storeStub.resolves(expectedTransfer)

        const result = await getUpdatedTransfer(ctx, transferValues)

        expect(result).to.equal(expectedTransfer)
    })

    it("should create new transfer with passed values", async function () {

        const transferValues: Partial<Transfer> = {
            depositNonce: toBigInt(123),
            fromDomainID: 1, 
            toDomainID: 2, 
            fromDomain: {id: "1", name: "testDomain", lastIndexedBlock: "0", transfersFrom: [], transfersTo: []},
            status: TransferStatus.pending,
            id: "1",
            accountID: "0x1", 
            resource: undefined,
            resourceID: undefined,
            toDomain: undefined,
            destination: undefined,
            amount: undefined,
            deposit: undefined,
            execution: undefined,
            fee: undefined,
            account: undefined,
            message: undefined,
            usdValue: undefined
        }

        const expectedTransfer: Transfer = {
            depositNonce: toBigInt(123),
            fromDomainID: 1,
            toDomainID: 2,
            fromDomain: {id: "1", name: "testDomain", lastIndexedBlock: "0", transfersFrom: [], transfersTo: []},
            status: TransferStatus.pending,
            id: "1",
            accountID: "0x1", 
            resource: undefined,
            resourceID: undefined,
            toDomain: undefined,
            destination: undefined,
            amount: undefined,
            deposit: undefined,
            execution: undefined,
            fee: undefined,
            account: undefined,
            message: undefined,
            usdValue: undefined
        }

        storeStub.resolves(null)

        const result = await getUpdatedTransfer(ctx, transferValues)

        expect(result).to.deep.equal(expectedTransfer)
    })
}); 