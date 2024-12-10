/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import { ApiPromise } from "@polkadot/api";
import { expect } from "chai";
import sinon from "sinon";
import { SubstrateParser } from "../../src/indexer/substrateIndexer/substrateParser";
import { IParser } from "../../src/indexer/indexer";
import { Network, ResourceType } from "@buildwithsygma/core";
import { Domain as DomainType } from "../../src/indexer/config";
import { events } from "../../src/indexer/substrateIndexer/types";
import type { Event } from "../../src/indexer/substrateIndexer/substrateProcessor";
import { generateTransferID } from "../../src/indexer/utils";
import { EVMParser } from "../../src/indexer/evmIndexer/evmParser";
import { JsonRpcProvider } from "ethers";
import {
  V3AssetId,
} from "../../src/indexer/substrateIndexer/types/v1260";
import {Context} from "../../src/indexer/substrateIndexer/substrateProcessor"
import { Domain, Resource, Token } from "../../src/model";

describe("Substrate parser", () => {
  let provider: sinon.SinonStubbedInstance<ApiPromise>;
  let parser: SubstrateParser;
  let ctx: Context;
  // Mock Data
  const mockResource = {
    id: '0x0000000000000000000000000000000000000000000000000000000000000300',
    type: 'fungible',
  };
  
  const mockToken = {
    id:"tokenID",
    tokenAddress: "0x1234567890abcdef1234567890abcdef12345678",
    decimals: 18,
    tokenSymbol: "ERC20LRTest",
    domainID: 2,
    resourceID: mockResource.id
  };

const mockSourceDomain = {
  id: '1',
};
  before(() => {
    provider = sinon.createStubInstance(ApiPromise);

    parser = new SubstrateParser(provider);

    const parsers = new Map<number, IParser>();
    parsers.set(1, new EVMParser(new JsonRpcProvider()));
    parser.setParsers(parsers);
  });

  describe("parseDeposit", () => {
    let findOneStub: sinon.SinonStub;

    beforeEach(() => {
      ctx = {
        store: {
          findOne: sinon.stub(),
        },
      } as unknown as Context;
  
      // Stub each findOne call with appropriate return values
      findOneStub = ctx.store.findOne as sinon.SinonStub;
    });
  
    afterEach(() => {
      sinon.restore();
    });
    it("should parse a deposit correctly", async () => {
      findOneStub.withArgs(Resource, { where: { id: mockResource.id } }).resolves(mockResource);
      findOneStub.withArgs(Token, { where: { resource: mockResource, domainID: "4" } }).resolves(mockToken);
      let event: Event = {
        block: { height: 1, timestamp: 1633072800 },
        extrinsic: { id: "0000000001-0ea58-000001", hash: "0x00" },
      } as Event;

      const fromDomain: DomainType = {
        id: 4,
        chainId: 5,
        caipId: "polkadot:5",
        name: "Sygma standalone pallet",
        type: Network.SUBSTRATE,
        bridge: "",
        handlers: [],
        nativeTokenSymbol: "syg",
        nativeTokenDecimals: 12,
        blockConfirmations: 2,
        startBlock: 5,
        feeRouter: "",
        feeHandlers: [],
        resources: [
          {
            resourceId:
              "0x0000000000000000000000000000000000000000000000000000000000000300",
            caip19: "polkadot:5",
            type: ResourceType.FUNGIBLE,
            address: "",
            symbol: "PHA",
            decimals: 12,
          },
        ],
      };

      const decodedEvent = {
        destDomainId: 1,
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000300",
        depositNonce: BigInt(1),
        sender: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
        transferType: ResourceType.FUNGIBLE as any,
        depositData:
          "0x00000000000000000000000000000000000000000000000000000000000f424000000000000000000000000000000000000000000000000000000000000000145c1f5961696bad2e73f73417f07ef55c62a2dc5b",
        handlerResponse: "",
      };
      sinon
        .stub(events.sygmaBridge.deposit.v1250, "decode")
        .returns(decodedEvent);

      const result = await parser.parseDeposit(event, fromDomain, ctx);

      expect(result).to.deep.include({
        decodedDepositLog: {
          id: '1-4-1',
          blockNumber: 1,
          depositNonce: '1',
          toDomainID: '1',
          sender: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
          destination: '0x5c1f5961696bad2e73f73417f07ef55c62a2dc5b',
          fromDomainID: '4',
          resourceID: '0x0000000000000000000000000000000000000000000000000000000000000300',
          txHash: '0000000001-0ea58-000001',
          timestamp: new Date(1633072800),
          depositData: '0x00000000000000000000000000000000000000000000000000000000000f424000000000000000000000000000000000000000000000000000000000000000145c1f5961696bad2e73f73417f07ef55c62a2dc5b',
          handlerResponse: '',
          transferType: 'fungible',
          amount: '0.000000000001'
        },
        decodedFeeLog: {
          id: result?.decodedFeeLog.id,
          amount: '50',
          domainID: '4',
          tokenID: mockToken.id,
          txIdentifier: '0000000001-0ea58-000001'
        }

      });
    });

    it("should throw an error if destination parser is not found", () => {
      let event: Event = {
        block: { height: 1, timestamp: 1633072800 },
        extrinsic: { id: "00", hash: "0x00" },
      } as Event;

      const fromDomain: DomainType = {
        id: 4,
        chainId: 5,
        resources: [
          {
            resourceId:
              "0x0000000000000000000000000000000000000000000000000000000000000300",
            caip19: "polkadot:5",
            type: ResourceType.FUNGIBLE,
            address: "",
            symbol: "PHA",
            decimals: 12,
          },
        ],
      } as DomainType;

      const decodedEvent = {
        destDomainId: 999,
        resourceId: "0x00",
        depositNonce: BigInt(0),
        sender: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
        transferType: ResourceType.FUNGIBLE as any,
        depositData: "",
        handlerResponse: "",
      };
      sinon
        .stub(events.sygmaBridge.deposit.v1250, "decode")
        .returns(decodedEvent);

      try {
        parser.parseDeposit(event, fromDomain, ctx);
        expect.fail("Expected error was not thrown");
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
      }
    });

    it("should throw an error if resource is not found", () => {
      let event: Event = {
        block: { height: 1, timestamp: 1633072800 },
        extrinsic: { id: "00", hash: "0x00" },
      } as Event;

      const fromDomain: DomainType = {
        id: 4,
        chainId: 5,
        resources: [
          {
            resourceId:
              "0x0000000000000000000000000000000000000000000000000000000000000300",
            caip19: "polkadot:5",
            type: ResourceType.FUNGIBLE,
            address: "",
            symbol: "PHA",
            decimals: 12,
          },
        ],
      } as DomainType;

      const decodedEvent = {
        destDomainId: 1,
        resourceId: "0x1234567890abcdef1234567890abcdef12345678",
        depositNonce: BigInt(0),
        sender: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
        transferType: ResourceType.FUNGIBLE as any,
        depositData: "",
        handlerResponse: "",
      };
      sinon
        .stub(events.sygmaBridge.deposit.v1250, "decode")
        .returns(decodedEvent);

      try {
        parser.parseDeposit(event, fromDomain, ctx);
        expect.fail("Expected error was not thrown");
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
      }
    });
  });

  describe("parseProposalExecution", () => {
    let findOneStub: sinon.SinonStub;

    beforeEach(() => {
      ctx = {
        store: {
          findOne: sinon.stub(),
        },
      } as unknown as Context;
  
      // Stub each findOne call with appropriate return values
      findOneStub = ctx.store.findOne as sinon.SinonStub;
    });
  
    afterEach(() => {
      sinon.restore();
    });
    it("should parse a proposal execution correctly", async () => {
      findOneStub.withArgs(Domain, { where: { id: mockSourceDomain.id } }).resolves(mockSourceDomain);

      let event: Event = {
        block: { height: 1, timestamp: 1633072800 },
        extrinsic: { id: "0000000001-0ea58-000001", hash: "0x00" },
      } as Event;

      const toDomain: DomainType = { id: 4 } as DomainType;

      const decodedEvent = {
        originDomainId: 1,
        depositNonce: BigInt(1),
        dataHash: "",
      };
      sinon
        .stub(events.sygmaBridge.proposalExecution.v1250, "decode")
        .returns(decodedEvent);

      const result = await parser.parseProposalExecution(event, toDomain, ctx);
      expect(result).to.deep.include({
        id: generateTransferID("1", "1", "4"),
        blockNumber: 1,
        depositNonce: "1",
        txHash: "0000000001-0ea58-000001",
        fromDomainID: "1",
        toDomainID: "4",
        timestamp: new Date(1633072800),
      });
    });
  });

  describe("parseFailedHandlerExecution", () => {
    let findOneStub: sinon.SinonStub;

    beforeEach(() => {
      ctx = {
        store: {
          findOne: sinon.stub(),
        },
      } as unknown as Context;
  
      // Stub each findOne call with appropriate return values
      findOneStub = ctx.store.findOne as sinon.SinonStub;
    });
  
    afterEach(() => {
      sinon.restore();
    });
    it("should parse a failed handler execution correctly", async () => {
      findOneStub.withArgs(Domain, { where: { id: mockSourceDomain.id } }).resolves(mockSourceDomain);

      let event: Event = {
        block: { height: 1, timestamp: 1633072800 },
        extrinsic: { id: "0000000001-0ea58-000001", hash: "0x00" },
      } as Event;

      const toDomain: DomainType = { id: 4 } as DomainType;

      const decodedEvent = {
        error: "error",
        originDomainId: 1,
        depositNonce: BigInt(1),
      };
      sinon
        .stub(events.sygmaBridge.failedHandlerExecution.v1250, "decode")
        .returns(decodedEvent);

      const result = await parser.parseFailedHandlerExecution(event, toDomain, ctx);

      expect(result).to.deep.include({
        id: generateTransferID("1", "1", "4"),
        fromDomainID: "1",
        toDomainID: "4",
        depositNonce: "1",
        txHash: "0000000001-0ea58-000001",
        blockNumber: 1,
        timestamp: new Date(1633072800),
        message: "error",
      });
    });
  });

  describe("parseFee", () => {
    let findOneStub: sinon.SinonStub;

    beforeEach(() => {
      ctx = {
        store: {
          findOne: sinon.stub(),
        },
      } as unknown as Context;
  
      // Stub each findOne call with appropriate return values
      findOneStub = ctx.store.findOne as sinon.SinonStub;
    });
  
    afterEach(() => {
      sinon.restore();
    });
    it("should parse fee correctly", async () => {
      findOneStub.withArgs(Resource, { where: { id: mockResource.id } }).resolves(mockResource);
      findOneStub.withArgs(Token, { where: { resource: mockResource, domainID: "4" } }).resolves(mockToken);
      let event: Event = {
        block: { height: 1, timestamp: 1633072800 },
        extrinsic: { id: "0000000001-0ea58-000001", hash: "0x00" },
      } as Event;

      const fromDomain: DomainType = {
        id: 4,
        chainId: 5,
        caipId: "polkadot:5",
        name: "Sygma standalone pallet",
        type: Network.SUBSTRATE,
        bridge: "",
        handlers: [],
        nativeTokenSymbol: "syg",
        nativeTokenDecimals: 12,
        blockConfirmations: 2,
        startBlock: 5,
        feeRouter: "",
        feeHandlers: [],
        resources: [
          {
            resourceId:
              "0x0000000000000000000000000000000000000000000000000000000000000300",
            caip19: "polkadot:5",
            type: ResourceType.FUNGIBLE,
            address: "",
            symbol: "PHA",
            decimals: 12,
          },
        ],
      };

      const decodedEvent = {
        feePayer: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
        destDomainId: 1,
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000300",
        feeAmount: BigInt(10),
        feeAssetId: {
          __kind: "Concrete",
          value: { parents: 1, interior: { __kind: "X3", value: {} } },
        } as V3AssetId,
      };
      sinon
        .stub(events.sygmaBridge.feeCollected.v1260, "decode")
        .returns(decodedEvent);

      const result = await parser.parseFee(event, fromDomain, ctx);
      expect(result).to.deep.include({
        id: result?.id,
        amount: '10',
        domainID: '4',
        tokenID: 'tokenID',
        txIdentifier: '0000000001-0ea58-000001'
      });
    });

    it("should throw an error if resource is not found", () => {
      let event: Event = {
        block: { height: 1, timestamp: 1633072800 },
        extrinsic: { id: "00", hash: "0x00" },
      } as Event;

      const fromDomain: DomainType = {
        id: 4,
        chainId: 5,
        resources: [
          {
            resourceId:
              "0x0000000000000000000000000000000000000000000000000000000000000300",
            caip19: "polkadot:5",
            type: ResourceType.FUNGIBLE,
            address: "",
            symbol: "PHA",
            decimals: 12,
          },
        ],
      } as DomainType;

      const decodedEvent = {
        feePayer: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
        destDomainId: 1,
        resourceId:
          "0x1234567890abcdef1234567890abcdef12345678",
        feeAmount: BigInt(10),
        feeAssetId: {
          __kind: "Concrete",
          value: { parents: 1, interior: { __kind: "X3", value: {} } },
        } as V3AssetId,
      };

      sinon
        .stub(events.sygmaBridge.feeCollected.v1260, "decode")
        .returns(decodedEvent);

      try {
        parser.parseFee(event, fromDomain, ctx);
        expect.fail("Expected error was not thrown");
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
      }
    });
  });

  afterEach(() => {
    sinon.restore();
  });
});