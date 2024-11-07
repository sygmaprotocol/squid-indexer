/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/

import { expect } from "chai";
import sinon from "sinon";
import { JsonRpcProvider } from "ethers";
import { EVMParser } from "../../src/indexer/evmIndexer/evmParser";
import { Log } from "@subsquid/evm-processor";
import { FeeHandlerType, Network, ResourceType } from "@buildwithsygma/core";
import * as bridge from "../../src/abi/bridge";
import { generateTransferID } from "../../src/indexer/utils";
import { Domain as DomainType, HandlerType, Token } from "../../src/indexer/config";
import {IParser } from "../../src/indexer/indexer";
import {Context} from "../../src/indexer/evmIndexer/evmProcessor"
import { Domain, Resource } from "../../src/model";

describe("EVMParser", () => {
  let provider: sinon.SinonStubbedInstance<JsonRpcProvider>;
  let parser: EVMParser;
  let tokens: Map<string, Token>;
  let ctx: Context;
  // Mock Data
const mockResource = {
  id: '0x0000000000000000000000000000000000000000000000000000000000000300',
  type: 'fungible',
  tokenAddress: "0x1234567890abcdef1234567890abcdef12345678",
  decimals: 18,
};

const mockSourceDomain = {
  id: '2',
};

  before(() => {
    // Mock provider
    provider = sinon.createStubInstance(JsonRpcProvider);
    parser = new EVMParser(provider as any);
    const parsers = new Map<number, IParser>()
    parsers.set(3,parser)
    parser.setParsers(parsers)
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

    it("should parse a deposit log correctly", async () => {
      findOneStub.withArgs(Resource, { where: { id: mockResource.id } }).resolves(mockResource);
      findOneStub.withArgs(Resource, { where: { tokenAddress: "0x1234567890abcdef1234567890abcdef12345678", domainID: "2" } }).resolves(mockResource);
      const log: Log = {
        block: { height: 1, timestamp: 1633072800 },
        transaction: {
          from: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
          hash: "0xTxHash",
        },
      } as Log;

      const fromDomain: DomainType = {
        id: 2,
        chainId: 11155111,
        caipId: "eip155:11155111",
        name: "sepolia",
        type: Network.EVM,
        bridge: "0x4CF326d3817558038D1DEF9e76b727202c3E8492",
        handlers: [
          {
            type: HandlerType.ERC20, 
            address: "0x0d4fB069753bdf1C5aB48302e9744BF222A9F4e8"
          }
        ],
        nativeTokenSymbol: "eth",
        nativeTokenDecimals: 18,
        blockConfirmations: 5,
        startBlock: 5703542,
        feeRouter: "0xD277478b4684Ed8594d5eb5B228AA7aDbA59df43",
        feeHandlers: [
          {
            address: "0x356B7B3C25355325CcBFBCF00a82895F93f086b7",
            type: FeeHandlerType.BASIC
          }
        ],
        resources: [
          {
            resourceId: "0x0000000000000000000000000000000000000000000000000000000000000300",
            caip19: "eip155:11155111/erc20:0x7d58589b6C1Ba455c4060a3563b9a0d447Bef9af",
            type: ResourceType.FUNGIBLE,
            address: "0x7d58589b6C1Ba455c4060a3563b9a0d447Bef9af",
            symbol: "ERC20LRTest",
            decimals: 18
          },
        ]
      };

      // Mock bridge event decode
      const event = {
        depositNonce: BigInt(1),
        destinationDomainID: 3,
        resourceID: "0x0000000000000000000000000000000000000000000000000000000000000300",
        user: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
        data: "0x0000000000000000000000000000000000000000000000000162ea9c8f924d3c00000000000000000000000000000000000000000000000000000000000000149a17fa0a2824ea855ec6ad3eab3aa2516ec6626d",
        handlerResponse: "",
      };
      sinon.stub(bridge.events.Deposit, "decode").returns(event);

      // Mock getFee method
      sinon.stub(parser, "getFee").resolves({
        tokenAddress: "0x1234567890abcdef1234567890abcdef12345678",
        amount: "0.01",
      });

      const result = await parser.parseDeposit(log, fromDomain, ctx);

      console.log(result)
      expect(result).to.deep.include(
        {
        decodedDepositLog: {
        id: generateTransferID("1", "2", "3"),
        blockNumber: 1,
        depositNonce: "1",
        toDomainID: "3",
        sender: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
        fromDomainID: "2",
        resourceID: "0x0000000000000000000000000000000000000000000000000000000000000300",
        txHash: "0xTxHash",
        timestamp: new Date(1633072800),
        transferType: ResourceType.FUNGIBLE,
        amount: '0.0999000999000999',
        destination: '0x9a17fa0a2824ea855ec6ad3eab3aa2516ec6626d',
        depositData: "0x0000000000000000000000000000000000000000000000000162ea9c8f924d3c00000000000000000000000000000000000000000000000000000000000000149a17fa0a2824ea855ec6ad3eab3aa2516ec6626d",
        handlerResponse: ""
 
      },
          decodedFeeLog: {
            id: result?.decodedFeeLog.id,
            tokenAddress: "0x1234567890abcdef1234567890abcdef12345678",
            resourceID: "0x0000000000000000000000000000000000000000000000000000000000000300",
            txIdentifier: "0xTxHash",
            domainID: "2",
            amount: "0.01",
          }
        }
      );
    });


    it("should skip deposits to unsupported domains", async () => {
      findOneStub.withArgs(Resource, { where: { id: mockResource.id } }).resolves(mockResource);
      const log: Log = {
        block: { height: 1, timestamp: 1633072800 },
        transaction: {
          from: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
          hash: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
        },
      } as Log;

      const fromDomain: DomainType = {
        id: 2,
        chainId: 11155111,
        caipId: "eip155:11155111",
        name: "sepolia",
        type: Network.EVM,
        bridge: "0x4CF326d3817558038D1DEF9e76b727202c3E8492",
        handlers: [
          {
            type: HandlerType.ERC20, 
            address: "0x0d4fB069753bdf1C5aB48302e9744BF222A9F4e8"
          }
        ],
        nativeTokenSymbol: "eth",
        nativeTokenDecimals: 18,
        blockConfirmations: 5,
        startBlock: 5703542,
        feeRouter: "0xD277478b4684Ed8594d5eb5B228AA7aDbA59df43",
        feeHandlers: [
          {
            address: "0x356B7B3C25355325CcBFBCF00a82895F93f086b7",
            type: FeeHandlerType.BASIC
          }
        ],
        resources: [
          {
            resourceId: "0x0000000000000000000000000000000000000000000000000000000000000300",
            caip19: "eip155:11155111/erc20:0x7d58589b6C1Ba455c4060a3563b9a0d447Bef9af",
            type: ResourceType.FUNGIBLE,
            address: "0x7d58589b6C1Ba455c4060a3563b9a0d447Bef9af",
            symbol: "ERC20LRTest",
            decimals: 18
          },
        ]
      };

      // Mock bridge event decode
      const event = {
        depositNonce: BigInt(1),
        destinationDomainID: 4,
        resourceID: "0x0000000000000000000000000000000000000000000000000000000000000300",
        user: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
        data: "0x0000000000000000000000000000000000000000000000000162ea9c8f924d3c00000000000000000000000000000000000000000000000000000000000000149a17fa0a2824ea855ec6ad3eab3aa2516ec6626d",
        handlerResponse: "",
      };
      sinon.stub(bridge.events.Deposit, "decode").returns(event);

      // Mock getFee method
      sinon.stub(parser, "getFee").resolves({
        tokenAddress: "0x1234567890abcdef1234567890abcdef12345678",
        amount: "0.01",
      });

      const result = await parser.parseDeposit(log, fromDomain, ctx);

      expect(result).to.be.null
    });


    it("should skip deposits with unsupported resource", async () => {
      findOneStub.withArgs(Resource, { where: { id: mockResource.id } }).resolves(undefined);
      const log: Log = {
        block: { height: 1, timestamp: 1633072800 },
        transaction: {
          from: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
          hash: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
        },
      } as Log;

      const fromDomain: DomainType = {
        id: 2,
        chainId: 11155111,
        resources: [
          {
            resourceId: "0x0000000000000000000000000000000000000000000000000000000000000300",
            caip19: "eip155:11155111/erc20:0x7d58589b6C1Ba455c4060a3563b9a0d447Bef9af",
            type: ResourceType.FUNGIBLE,
            address: "0x7d58589b6C1Ba455c4060a3563b9a0d447Bef9af",
            symbol: "ERC20LRTest",
            decimals: 18
          },
        ]
      } as DomainType;

      // Mock bridge event decode
      const event = {
        depositNonce: BigInt(1),
        destinationDomainID: 3,
        resourceID: "0x0000000000000000000000000000000000000000000000000000000000000300",
        user: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
        data: "0x0000000000000000000000000000000000000000000000000162ea9c8f924d3c00000000000000000000000000000000000000000000000000000000000000149a17fa0a2824ea855ec6ad3eab3aa2516ec6626d",
        handlerResponse: "",
      };
      sinon.stub(bridge.events.Deposit, "decode").returns(event);

      // Mock getFee method
      sinon.stub(parser, "getFee").resolves({
        tokenAddress: "0x1234567890abcdef1234567890abcdef12345678",
        amount: "0.01",
      });

      const result = await parser.parseDeposit(log, fromDomain, ctx);

      expect(result).to.be.null;
    });

    it("should throw an error if resource is not found", async () => {
      const log: Log = { block: { height: 1, timestamp: 1633072800 }, transaction: {} } as any;
      const fromDomain: DomainType = {
        id: 2,
        chainId: 11155111,
        resources: [
          {
            resourceId: "0x0000000000000000000000000000000000000000000000000000000000000300",
            caip19: "eip155:11155111/erc20:0x7d58589b6C1Ba455c4060a3563b9a0d447Bef9af",
            type: ResourceType.FUNGIBLE,
            address: "0x7d58589b6C1Ba455c4060a3563b9a0d447Bef9af",
            symbol: "ERC20LRTest",
            decimals: 18
          },
        ]
      } as DomainType;

      const event = {
        depositNonce: BigInt(1),
        destinationDomainID: 3,
        resourceID: "0x1234567890abcdef1234567890abcdef12345678",
        user: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
        data: "0x...",
        handlerResponse: "",
      };
      sinon.stub(bridge.events.Deposit, "decode").returns(event);

      try {
        await parser.parseDeposit(log, fromDomain, ctx);
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
    it("should parse a proposal execution log correctly", async () => {
      findOneStub.withArgs(Domain, { where: { id: mockSourceDomain.id } }).resolves(mockSourceDomain);
      const log: Log = {
        block: { height: 1, timestamp: 1633072800 },
        transaction: {
          hash: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
        },
      } as Log;

      const toDomain: DomainType = { id: 3 } as DomainType;

      const event = {
        depositNonce: BigInt(1),
        originDomainID: 2,
        dataHash: "",
        handlerResponse: ""
      };
      sinon.stub(bridge.events.ProposalExecution, "decode").returns(event);

      const result = await parser.parseProposalExecution(log, toDomain, ctx);

      expect(result).to.deep.include({
        id: generateTransferID("1", "2", "3"),
        blockNumber: 1,
        depositNonce: "1",
        txHash: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
        fromDomainID: "2",
        toDomainID: "3",
      });
    });

    it("should skip execution from unsupported domain", async () => {
      findOneStub.withArgs(Domain, { where: { id: mockSourceDomain.id } }).resolves(undefined);
      const log: Log = {
        block: { height: 1, timestamp: 1633072800 },
        transaction: {
          hash: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
        },
      } as Log;

      const toDomain: DomainType = { id: 3 } as DomainType;

      const event = {
        depositNonce: BigInt(1),
        originDomainID: 2,
        dataHash: "",
        handlerResponse: ""
      };
      sinon.stub(bridge.events.ProposalExecution, "decode").returns(event);

      const result = await parser.parseProposalExecution(log, toDomain, ctx);

      expect(result).to.be.null
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
    it("should parse a failed handler execution log correctly", async () => {
      findOneStub.withArgs(Domain, { where: { id: mockSourceDomain.id } }).resolves(mockSourceDomain);
      const log: Log = {
        block: { height: 1, timestamp: 1633072800 },
        transaction: {
          hash: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
        },
      } as Log;

      const toDomain: DomainType = { id: 3 } as DomainType;

      const event = {
        depositNonce: BigInt(1),
        originDomainID: 2,
        lowLevelData: "08C379A00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001245524332303A2063616C6C206661696C65640000000000000000000000000000",
      };
      sinon.stub(bridge.events.FailedHandlerExecution, "decode").returns(event);

      const result = await parser.parseFailedHandlerExecution(log, toDomain, ctx);

      expect(result).to.deep.include({
        id: generateTransferID("1", "2", "3"),
        fromDomainID: "2",
        toDomainID: "3",
        depositNonce: "1",
        txHash: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
        blockNumber: 1,
        timestamp: new Date(1633072800),
        message: "ERC20: call failed",
      });
    });

    it("should skip failed executions from unsupported domain", async () => {
      findOneStub.withArgs(Domain, { where: { id: mockSourceDomain.id } }).resolves(undefined);
      const log: Log = {
        block: { height: 1, timestamp: 1633072800 },
        transaction: {
          hash: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
        },
      } as Log;

      const toDomain: DomainType = { id: 3 } as DomainType;

      const event = {
        depositNonce: BigInt(1),
        originDomainID: 2,
        lowLevelData: "08C379A00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001245524332303A2063616C6C206661696C65640000000000000000000000000000",
      };
      sinon.stub(bridge.events.FailedHandlerExecution, "decode").returns(event);

      const result = await parser.parseFailedHandlerExecution(log, toDomain, ctx);

      expect(result).to.be.null;
    });
  });
});
