/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import { expect } from "chai"
import {  decodeAmountsOrTokenId } from "../../src/indexer/evmIndexer/utils"
import { DepositType } from "../../src/indexer/evmIndexer/evmTypes"

describe("Decode amount or token id", function () {
    it("should decode amount for fungible transfer", async function () {
      const data =
        "0x0000000000000000000000000000000000000000000000000000000017d7840000000000000000000000000000000000000000000000000000000000000000149a17fa0a2824ea855ec6ad3eab3aa2516ec6626d"
      const decimals = 8
      const resourceType = DepositType.FUNGIBLE
  
      const amount = decodeAmountsOrTokenId(data, decimals, resourceType)

      expect(amount).to.be.deep.equal("4.0")
    })

    it("should decode tokenId for non-fungible transfer", async function () {
        const data =
          "0x000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000141c3a03d04c026b1f4b4208d2ce053c5686e6fb8d"
        const decimals = 18
        const resourceType = DepositType.NONFUNGIBLE
    
        const tokenId = decodeAmountsOrTokenId(data, decimals, resourceType)
  
        expect(tokenId).to.be.deep.equal("3")
    })
  
    it("should return empty string for permissionless generic transfer", async function () {
      const data =
        "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
      const decimals = 18
      const resourceType = DepositType.PERMISSIONLESS_GENERIC
  
      const amount = decodeAmountsOrTokenId(data, decimals, resourceType)

      expect(amount).to.be.deep.equal("")
    })

    it("should return empty string for permissioned generic transfer", async function () {
        const data =
          "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        const decimals = 18
        const resourceType = DepositType.PERMISSIONED_GENERIC
    
        const amount = decodeAmountsOrTokenId(data, decimals, resourceType)
  
        expect(amount).to.be.deep.equal("")
    })

    it("should return empty string for semi-fungible transfer", async function () {
        const data =
          "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
       
        const decimals = 18
        const resourceType = DepositType.SEMIFUNGIBLE
    
        const amount = decodeAmountsOrTokenId(data, decimals, resourceType)
  
        expect(amount).to.be.deep.equal("")
    })
  
})
  

