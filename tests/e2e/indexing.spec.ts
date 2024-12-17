/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/

import { expect } from "chai";
import { Transfer, Deposit, Execution, TransferStatus } from "../../src/model";
import { Network, ResourceType } from "@buildwithsygma/core";

const NUMBER_OF_TRANSFERS = 31;
const NUMBER_OF_SUBSTRATE_DEPOSITS = 1;
const NUMBER_OF_FUNGIBLE_DEPOSITS = 29;
const NUMBER_OF_PERMISSIONLESS_DEPOSITS = 1;
const NUMBER_OF_NFT_DEPOSITS = 1;

const FUNGIBLE_EVM_DEPOSIT_TXHASH =
  "0x0a4fb75c91ca774d1b2faeed14a0d9c8f261dba64fc8adfe070c0b9f78a07492";
const FUNGIBLE_EVM_EXECUTION_TXHASH =
  "0x10f878f78f6e5fe7a916c40b981d62ffe6e04bff7c783802a9ecda36dae059fb";
const NONFUNGIBLE_EVM_DEPOSIT_TXHASH =
  "0x12327002087fe09d30a4bd45e97e55549d92dbf05d254788591dc2b6bca4ef0f";
const FUNGIBLE_SUBSTRATE_TO_EVM_DEPOSIT_TXHASH = "0000000279-f6443-000001";
const FUNGIBLE_EVM_TO_SUBSTRATE_DEPOSIT_TXHASH =
  "0x967b320daebffcba435b6bf9ba493963471f6ca9d12c84c9f156bda6862934e0";
const PERMISSIONLESS_GENERIC_EVM_DEPOSIT_TXHASH =
  "0x2b355542a454d8faedccc75c8741ef0d2f531ea4cd8ed53544734ff681377699";

const SENDER_ADDRESS = "0x5c1f5961696bad2e73f73417f07ef55c62a2dc5b";

type TransferResponse = Transfer & {
  deposit: Deposit;
  execution: Execution;
};

describe("Indexer e2e tests", function () {
  let substrateDeposits = 0;
  let fungibleDeposits = 0;
  let permissionlessDeposits = 0;
  let nftDeposits = 0;

  before(async () => {
    let numberOfTransfers = 0;
    let isProcessing = false;
    while (numberOfTransfers !== NUMBER_OF_TRANSFERS || isProcessing) {
      const response = await fetch(
        "http://localhost:8000/api/transfers?page=1&limit=100"
      );
      console.log("RESPONSE:::::::::::", response)
      const transfers: Array<TransferResponse> = await response.json();

      numberOfTransfers = transfers.length;

      isProcessing = false;
      for (const transfer of transfers) {
        if (!transfer.deposit || !transfer.execution) {
          isProcessing = true;
        }
      }
    }
  });

  it("should succesfully fetch all transfers", async () => {
    const response = await fetch(
      "http://localhost:8000/api/transfers?page=1&limit=100"
    );
    const transfers: Array<TransferResponse> = await response.json();

    for (const transfer of transfers) {
      if (transfer.route.fromDomain?.name.toLowerCase() == Network.SUBSTRATE) {
        substrateDeposits++;
      }
      switch (transfer.route.resource?.type) {
        case ResourceType.FUNGIBLE: {
          fungibleDeposits++;
          break;
        }
        case ResourceType.NON_FUNGIBLE: {
          nftDeposits++;
          break;
        }
        case ResourceType.PERMISSIONLESS_GENERIC: {
          permissionlessDeposits++;
          break;
        }
      }
    }

    expect(transfers.length).to.be.deep.equal(NUMBER_OF_TRANSFERS);
    expect(substrateDeposits).to.be.eq(NUMBER_OF_SUBSTRATE_DEPOSITS);
    expect(fungibleDeposits).to.be.eq(NUMBER_OF_FUNGIBLE_DEPOSITS);
    expect(permissionlessDeposits).to.be.eq(NUMBER_OF_PERMISSIONLESS_DEPOSITS);
    expect(nftDeposits).to.be.eq(NUMBER_OF_NFT_DEPOSITS);

    transfers.map((transfer) => {
      expect(transfer.id).to.be.not.null;
      expect(transfer.status).to.be.not.null;
      expect(transfer.depositNonce).to.be.not.null;
      expect(transfer.route).to.be.not.null;
      expect(transfer.route.fromDomainID).to.be.not.null;
      expect(transfer.route.toDomainID).to.be.not.null;
      expect(transfer.route.resourceID).to.be.not.null;
      expect(transfer.feeID).to.be.not.null;
      expect(transfer.fee).to.be.not.null;
      expect(transfer.amount).to.be.not.null;
      expect(transfer.deposit.txHash).to.be.not.null;
      expect(transfer.deposit.blockNumber).to.be.not.null;
      expect(transfer.deposit.depositData).to.be.not.null;
      expect(transfer.deposit.timestamp).to.be.not.null;
      expect(transfer.deposit.handlerResponse).to.be.not.null;
      expect(transfer.deposit.accountID).to.be.not.null;
      expect(transfer.deposit.account).to.be.not.null;
      expect(transfer.deposit.destination).to.be.not.null;
      expect(transfer.deposit.timestamp).to.be.not.null;
      expect(transfer.execution).to.be.not.null;
      expect(transfer.execution.timestamp).to.be.not.null;
      expect(transfer.execution.txHash).to.be.not.null;
      expect(transfer.execution.blockNumber).to.be.not.null;
      expect(transfer.execution.message).to.be.not.null;
    });
  });

  it("should succesfully fetch evm fungible transfer", async () => {
    const res = await fetch(
      `http://localhost:8000/api/transfers?txHash=${FUNGIBLE_EVM_DEPOSIT_TXHASH}`
    );
    const transfers: TransferResponse[] = await res.json();

    expect(res.status).to.be.deep.equal(200);
    expect(transfers.length).to.be.deep.equal(1);
    expect(transfers[0]).to.be.deep.equal({
      id: transfers[0].id,
      status: TransferStatus.executed,
      depositNonce: "1",
      routeID: transfers[0].routeID,
      route: {
        id: transfers[0].route.id,
        fromDomainID: "1",
        fromDomain: { name: "Ethereum 1", id: "1" },
        toDomainID: "2",
        toDomain: { name: "evm2", id: "2" },
        resourceID:
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        resource: {
          id: "0x0000000000000000000000000000000000000000000000000000000000000000",
          type: ResourceType.FUNGIBLE,
        },
      },
      fee: {
        id: transfers[0].fee?.id,
        amount: "100000000000000",
        tokenID: transfers[0].fee?.tokenID,
        token: {
          id: transfers[0].fee?.tokenID,
          resourceID: "",
          decimals: 18,
          tokenAddress: "0x0000000000000000000000000000000000000000",
          tokenSymbol: "eth",
        },
      },
      amount: "0.0000000000000001",
      deposit: {
        id: transfers[0].deposit.id,
        txHash:
          "0x0a4fb75c91ca774d1b2faeed14a0d9c8f261dba64fc8adfe070c0b9f78a07492",
        blockNumber: "115",
        depositData:
          "0x000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000145c1f5961696bad2e73f73417f07ef55c62a2dc5b",
        handlerResponse:
          "0x0000000000000000000000000000000000000000000000000000000000000064",
        timestamp: "2024-11-14T08:16:41.000Z",

        accountID: "0x5c1f5961696bad2e73f73417f07ef55c62a2dc5b",
        destination: "0x5c1f5961696bad2e73f73417f07ef55c62a2dc5b",
      },
      execution: {
        id: transfers[0].execution.id,
        txHash:
          "0x8be14ce560b614606e2fad63c6bd58f80a7bc2ae344114eed094ec5296178888",
        blockNumber: "123",
        timestamp: "2024-11-14T08:17:00.000Z",
        message: "",
      },
    });
  });

  it("should succesfully fetch evm fungible transfer by execution hash", async () => {
    const res = await fetch(
      `http://localhost:8000/api/transfers?txHash=${FUNGIBLE_EVM_EXECUTION_TXHASH}&component=execution`
    );
    const transfers: TransferResponse[] = await res.json();

    expect(res.status).to.be.deep.equal(200);
    expect(transfers.length).to.be.deep.equal(1);
    expect(transfers[0]).to.be.deep.equal({
      id: transfers[0].id,
      status: TransferStatus.executed,
      depositNonce: "29",
      routeID: transfers[0].routeID,
      route: {
        id: transfers[0].route.id,
        fromDomainID: "1",
        fromDomain: { name: "Ethereum 1", id: "1" },
        toDomainID: "2",
        toDomain: { name: "evm2", id: "2" },
        resourceID:
          "0x0000000000000000000000000000000000000000000000000000000000000300",
        resource: {
          id: "0x0000000000000000000000000000000000000000000000000000000000000300",
          type: ResourceType.FUNGIBLE,
        },
      },
      fee: {
        id: transfers[0].fee?.id,
        amount: "100000000000000",
        tokenID: transfers[0].fee?.tokenID,
        token: {
          id: transfers[0].fee?.tokenID,
          resourceID: "",
          decimals: 18,
          tokenAddress: "0x0000000000000000000000000000000000000000",
          tokenSymbol: "eth",
        },
      },
      amount: "0.0000000000000001",
      deposit: {
        id: transfers[0].deposit.id,
        txHash:
          "0xcf0ed5a25739be16c610e7fd17c8140f21b82128e28cccc5ccef5db16dca052f",
        blockNumber: "164",
        depositData:
          "0x000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000148e0a907331554af72563bd8d43051c2e64be5d35",
        handlerResponse:
          "0x0000000000000000000000000000000000000000000000000000000000000064",
        timestamp: "2024-11-14T08:18:21.000Z",

        accountID: "0x5c1f5961696bad2e73f73417f07ef55c62a2dc5b",
        destination: "0x8e0a907331554af72563bd8d43051c2e64be5d35",
      },
      execution: {
        id: transfers[0].execution.id,
        txHash:
          "0x10f878f78f6e5fe7a916c40b981d62ffe6e04bff7c783802a9ecda36dae059fb",
        blockNumber: "167",
        timestamp: "2024-11-14T08:18:30.000Z",
        message: "",
      },
    });
  });

  it("should succesfully fetch evm non-fungible transfer", async () => {
    const res = await fetch(
      `http://localhost:8000/api/transfers?txHash=${NONFUNGIBLE_EVM_DEPOSIT_TXHASH}`
    );
    const transfers: TransferResponse[] = await res.json();

    expect(res.status).to.be.deep.equal(200);
    expect(transfers.length).to.be.deep.equal(1);
    expect(transfers[0]).to.be.deep.equal({
      id: transfers[0].id,
      status: TransferStatus.executed,
      depositNonce: "2",
      routeID: transfers[0].routeID,
      route: {
        id: transfers[0].route.id,
        fromDomainID: "1",
        fromDomain: { name: "Ethereum 1", id: "1" },
        toDomainID: "2",
        toDomain: { name: "evm2", id: "2" },
        resourceID:
          "0x0000000000000000000000000000000000000000000000000000000000000200",
        resource: {
          id: "0x0000000000000000000000000000000000000000000000000000000000000200",
          type: ResourceType.NON_FUNGIBLE,
        },
      },
      fee: {
        id: transfers[0].fee?.id,
        amount: "100000000000000",
        tokenID: transfers[0].fee?.tokenID,
        token: {
          id: transfers[0].fee?.tokenID,
          resourceID: "",
          decimals: 18,
          tokenAddress: "0x0000000000000000000000000000000000000000",
          tokenSymbol: "eth",
        },
      },
      amount: "2935717020161974584",
      deposit: {
        id: transfers[0].deposit.id,
        txHash:
          "0x12327002087fe09d30a4bd45e97e55549d92dbf05d254788591dc2b6bca4ef0f",
        blockNumber: "130",
        depositData:
          "0x00000000000000000000000000000000000000000000000028bdc31363d2a13800000000000000000000000000000000000000000000000000000000000000148e0a907331554af72563bd8d43051c2e64be5d35000000000000000000000000000000000000000000000000000000000000000c6d657461646174612e75726c",
        handlerResponse: "0x6d657461646174612e746573746d657461646174612e75726c",
        timestamp: "2024-11-14T08:17:11.000Z",

        accountID: "0x5c1f5961696bad2e73f73417f07ef55c62a2dc5b",
        destination: "0x8e0a907331554af72563bd8d43051c2e64be5d35",
      },
      execution: {
        id: transfers[0].execution.id,
        txHash:
          "0x43c02a7cee493621c550e059489db14500b5a388185d61deeb7d9a7f52959e8d",
        blockNumber: "138",
        timestamp: "2024-11-14T08:17:31.000Z",
        message: "",
      },
    });
  });

  it("should succesfully fetch substrate to evm fungible transfer", async () => {
    const res = await fetch(
      `http://localhost:8000/api/transfers?txHash=${FUNGIBLE_SUBSTRATE_TO_EVM_DEPOSIT_TXHASH}`
    );
    const transfers: TransferResponse[] = await res.json();

    expect(res.status).to.be.deep.equal(200);
    expect(transfers.length).to.be.deep.equal(1);
    expect(transfers[0]).to.be.deep.equal({
      id: transfers[0].id,
      status: TransferStatus.executed,
      depositNonce: "0",
      routeID: transfers[0].routeID,
      route: {
        id: transfers[0].route.id,
        fromDomainID: "3",
        fromDomain: { name: "Substrate", id: "3" },
        toDomainID: "1",
        toDomain: { name: "Ethereum 1", id: "1" },
        resourceID:
          "0x0000000000000000000000000000000000000000000000000000000000000300",
        resource: {
          id: "0x0000000000000000000000000000000000000000000000000000000000000300",
          type: ResourceType.FUNGIBLE,
        },
      },
      fee: {
        id: transfers[0].fee?.id,
        amount: "0",
        tokenID: transfers[0].fee?.tokenID,
        token: {
          id: transfers[0].fee?.tokenID,
          resourceID:
            "0x0000000000000000000000000000000000000000000000000000000000000300",
          decimals: 6,
          tokenAddress:
            '{"concrete":{"parents":1,"interior":{"x3":[{"parachain":2004},{"generalKey":[5,"0x7379676d61000000000000000000000000000000000000000000000000000000"]},{"generalKey":[4,"0x7573646300000000000000000000000000000000000000000000000000000000"]}]}}}',
          tokenSymbol: "USDC",
        },
      },
      amount: "1.0",
      deposit: {
        id: transfers[0].deposit.id,
        txHash: "0000000279-f6443-000001",
        blockNumber: "279",
        depositData:
          "0x00000000000000000000000000000000000000000000000000000000000f424000000000000000000000000000000000000000000000000000000000000000145c1f5961696bad2e73f73417f07ef55c62a2dc5b",
        handlerResponse: "0x",
        timestamp: "2024-11-14T08:19:48.001Z",
        accountID:
          "0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d",
        destination: "0x5c1f5961696bad2e73f73417f07ef55c62a2dc5b",
      },
      execution: {
        id: transfers[0].execution.id,
        txHash:
          "0x9b10747083d576b05caa28edbecd5937080b77ae27da3485b29376e168e4076d",
        blockNumber: "218",
        timestamp: "2024-11-14T08:20:10.000Z",
        message: "",
      },
    });
  });

  it("should succesfully fetch evm to substrate fungible transfer", async () => {
    const res = await fetch(
      `http://localhost:8000/api/transfers?txHash=${FUNGIBLE_EVM_TO_SUBSTRATE_DEPOSIT_TXHASH}`
    );
    const transfers: TransferResponse[] = await res.json();

    expect(res.status).to.be.deep.equal(200);
    expect(transfers.length).to.be.deep.equal(1);
    expect(transfers[0]).to.be.deep.equal({
      id: transfers[0].id,
      status: TransferStatus.executed,
      depositNonce: "1",
      routeID: transfers[0].routeID,
      route: {
        id: transfers[0].route.id,
        fromDomainID: "1",
        fromDomain: { name: "Ethereum 1", id: "1" },
        toDomainID: "3",
        toDomain: { name: "Substrate", id: "3" },
        resourceID:
          "0x0000000000000000000000000000000000000000000000000000000000000300",
        resource: {
          id: "0x0000000000000000000000000000000000000000000000000000000000000300",
          type: ResourceType.FUNGIBLE,
        },
      },
      fee: {
        id: transfers[0].fee?.id,
        amount: "100000000000000",
        tokenID: transfers[0].fee?.tokenID,
        token: {
          id: transfers[0].fee?.tokenID,
          resourceID: "",
          decimals: 18,
          tokenAddress: "0x0000000000000000000000000000000000000000",
          tokenSymbol: "eth",
        },
      },
      amount: "0.0001",
      deposit: {
        id: transfers[0].deposit.id,
        txHash:
          "0x967b320daebffcba435b6bf9ba493963471f6ca9d12c84c9f156bda6862934e0",
        blockNumber: "195",
        depositData:
          "0x00000000000000000000000000000000000000000000000000005af3107a4000000000000000000000000000000000000000000000000000000000000000002400010100d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d",
        handlerResponse:
          "0x00000000000000000000000000000000000000000000000000005af3107a4000",
        timestamp: "2024-11-14T08:19:23.000Z",
        accountID: "0x5c1f5961696bad2e73f73417f07ef55c62a2dc5b",
        destination: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
      },
      execution: {
        id: transfers[0].execution.id,
        txHash: "0000000278-91805-000001",
        blockNumber: "278",
        timestamp: "2024-11-14T08:19:42.000Z",
        message: "",
      },
    });
  });

  it("should succesfully fetch evm permissionless generic transfer", async () => {
    const res = await fetch(
      `http://localhost:8000/api/transfers?txHash=${PERMISSIONLESS_GENERIC_EVM_DEPOSIT_TXHASH}`
    );
    const transfers: TransferResponse[] = await res.json();

    expect(res.status).to.be.deep.equal(200);
    expect(transfers.length).to.be.deep.equal(1);
    expect(transfers[0]).to.be.deep.equal({
      id: transfers[0].id,
      status: TransferStatus.executed,
      depositNonce: "28",
      routeID: transfers[0].routeID,
      route: {
        id: transfers[0].route.id,
        fromDomainID: "1",
        fromDomain: { name: "Ethereum 1", id: "1" },
        toDomainID: "2",
        toDomain: { name: "evm2", id: "2" },
        resourceID:
          "0x0000000000000000000000000000000000000000000000000000000000000500",
        resource: {
          id: "0x0000000000000000000000000000000000000000000000000000000000000500",
          type: ResourceType.PERMISSIONLESS_GENERIC,
        },
      },
      fee: {
        id: transfers[0].fee?.id,
        amount: "100000000000000",
        tokenID: transfers[0].fee?.tokenID,
        token: {
          id: transfers[0].fee?.tokenID,
          decimals: 18,
          resourceID: "",
          tokenAddress: "0x0000000000000000000000000000000000000000",
          tokenSymbol: "eth",
        },
      },
      amount: "",
      deposit: {
        id: transfers[0].deposit.id,
        txHash:
          "0x2b355542a454d8faedccc75c8741ef0d2f531ea4cd8ed53544734ff681377699",
        blockNumber: "155",
        depositData:
          "0x00000000000000000000000000000000000000000000000000000000000927c00004ea287d1514a2451c8553371e754f5e93a440adcca1c0dcf395145c1f5961696bad2e73f73417f07ef55c62a2dc5b35353436383833363939383137363233353732000000000000000000000000000000000000000000000000005c1f5961696bad2e73f73417f07ef55c62a2dc5b",
        handlerResponse: "0x",
        timestamp: "2024-11-14T08:18:03.000Z",
        accountID: "0x5c1f5961696bad2e73f73417f07ef55c62a2dc5b",
        destination: "0xa2451c8553371e754f5e93a440adcca1c0dcf395",
      },
      execution: {
        id: transfers[0].execution.id,
        txHash:
          "0x508195d23128b60c20a577eca7ace567e6ec68f636bad42ddb554b7d96644dd3",
        blockNumber: "162",
        timestamp: "2024-11-14T08:18:20.000Z",
        message: "",
      },
    });
  });

  it("should succesfully fetch all transfers by one sender", async () => {
    const res = await fetch(
      `http://localhost:8000/api/transfers?sender=${SENDER_ADDRESS}&page=1&limit=100`
    );
    const transfers: TransferResponse[] = await res.json();

    expect(res.status).to.be.deep.equal(200);
    expect(transfers.length).to.be.deep.equal(30);
  });
});
