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
import { Domain } from "../../src/indexer/config";
import { events } from "../../src/indexer/substrateIndexer/types";
import type { Event } from "../../src/indexer/substrateIndexer/substrateProcessor";
import { generateTransferID } from "../../src/indexer/utils";
import { EVMParser } from "../../src/indexer/evmIndexer/evmParser";
import { JsonRpcProvider } from "ethers";
import {
  V3AssetId,
} from "../../src/indexer/substrateIndexer/types/v1260";

describe("Substrate parser", () => {
  let provider: sinon.SinonStubbedInstance<ApiPromise>;
  let parser: SubstrateParser;

  before(() => {
    provider = sinon.createStubInstance(ApiPromise);

    parser = new SubstrateParser(provider);

    const parsers = new Map<number, IParser>();
    parsers.set(1, new EVMParser(new JsonRpcProvider(), new Map()));
    parser.setParsers(parsers);
  });

  describe("parseDeposit", () => {
    it("should parse a deposit correctly", () => {
      let event: Event = {
        block: { height: 1, timestamp: 1633072800 },
        extrinsic: { id: "0000000001-0ea58-000001", hash: "0x00" },
      } as Event;

      const fromDomain: Domain = {
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

      const result = parser.parseDeposit(event, fromDomain);

      expect(result).to.deep.include({
        id: generateTransferID("1", "4", "1"),
        blockNumber: 1,
        depositNonce: BigInt(1),
        toDomainID: 1,
        sender: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
        fromDomainID: 4,
        destination: "0x5c1f5961696bad2e73f73417f07ef55c62a2dc5b",
        amount: "0.000001",
        resourceID:
          "0x0000000000000000000000000000000000000000000000000000000000000300",
        txHash: "0000000001-0ea58-000001",
        timestamp: new Date(1633072800),
        transferType: ResourceType.FUNGIBLE,
      });
    });

    it("should throw an error if the destination parser is not found", () => {
      let event: Event = {
        block: { height: 1, timestamp: 1633072800 },
        extrinsic: { id: "00", hash: "0x00" },
      } as Event;

      const fromDomain: Domain = {
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
        destDomainId: 2,
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
        parser.parseDeposit(event, fromDomain);
        expect.fail("Expected error was not thrown");
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
      }
    });
  });

  describe("parseProposalExecution", () => {
    it("should parse a proposal execution correctly", async () => {
      let event: Event = {
        block: { height: 1, timestamp: 1633072800 },
        extrinsic: { id: "0000000001-0ea58-000001", hash: "0x00" },
      } as Event;

      const toDomain: Domain = { id: 4 } as Domain;

      const decodedEvent = {
        originDomainId: 1,
        depositNonce: BigInt(1),
        dataHash: "",
      };
      sinon
        .stub(events.sygmaBridge.proposalExecution.v1250, "decode")
        .returns(decodedEvent);

      const result = parser.parseProposalExecution(event, toDomain);

      expect(result).to.deep.include({
        id: generateTransferID("1", "1", "4"),
        blockNumber: 1,
        depositNonce: BigInt(1),
        txHash: "0000000001-0ea58-000001",
        fromDomainID: 1,
        toDomainID: 4,
        timestamp: new Date(1633072800),
      });
    });
  });

  describe("parseFailedHandlerExecution", () => {
    it("should parse a failed handler execution correctly", async () => {
      let event: Event = {
        block: { height: 1, timestamp: 1633072800 },
        extrinsic: { id: "0000000001-0ea58-000001", hash: "0x00" },
      } as Event;

      const toDomain: Domain = { id: 4 } as Domain;

      const decodedEvent = {
        error: "error",
        originDomainId: 1,
        depositNonce: BigInt(1),
      };
      sinon
        .stub(events.sygmaBridge.failedHandlerExecution.v1250, "decode")
        .returns(decodedEvent);

      const result = parser.parseFailedHandlerExecution(event, toDomain);

      expect(result).to.deep.include({
        id: generateTransferID("1", "1", "4"),
        fromDomainID: 1,
        toDomainID: 4,
        depositNonce: BigInt(1),
        txHash: "0000000001-0ea58-000001",
        blockNumber: 1,
        timestamp: new Date(1633072800),
        message: "error",
      });
    });
  });

  describe("parseFee", () => {
    it("should parse fee correctly", () => {
      let event: Event = {
        block: { height: 1, timestamp: 1633072800 },
        extrinsic: { id: "0000000001-0ea58-000001", hash: "0x00" },
      } as Event;

      const fromDomain: Domain = {
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

      const result = parser.parseFee(event, fromDomain);

      expect(result).to.deep.include({
        amount: "10",
        decimals: 12,
        tokenAddress: JSON.stringify({
          __kind: "Concrete",
          value: { parents: 1, interior: { __kind: "X3", value: {} } },
        }),
        tokenSymbol: "PHA",
        txIdentifier: "0000000001-0ea58-000001",
      });
    });
  });

  afterEach(() => {
    sinon.restore();
  });
});
