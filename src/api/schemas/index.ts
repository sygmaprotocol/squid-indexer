/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/

export const resourceSchema = {
  type: "object",
  nullable: true,
  properties: {
    id: {
      type: "string",
      format: "ObjectId",
      example: "1ffe10e3-c16c-4fdb-a357-380accf1eb66",
    },
    resourceID: {
      type: "string",
      format: "ObjectId",
      example:
        "0x0000000000000000000000000000000000000000000000000000000000000001",
    },
    type: { type: "string", example: "fungible" },
    decimals: { type: "integer", nullable: true, example: 18 },
    tokenAddress: {
      type: "string",
      example: "0x37356a2B2EbF65e5Ea18BD93DeA6869769099739",
    },
    tokenSymbol: { type: "string", example: "ERC20TST" },
  },
};

export const domainSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "ObjectId", example: "1" },
    name: { type: "string", example: "Ethereum" },
  },
};

export const feeSchema = {
  type: "object",
  nullable: true,
  properties: {
    id: {
      type: "string",
      format: "ObjectId",
      example: "1ffe10e3-c16c-4fdb-a357-380accf1eb66",
    },
    amount: { type: "string", example: "10000000000000000" },
    resourceID: {
      type: "string",
      format: "ObjectId",
      example: "1ffe10e3-c16c-4fdb-a357-380accf1eb66",
    },
  },
};

export const transferStatusSchema = {
  status: {
    type: "string",
    enum: ["pending", "executed", "failed"],
  },
};

export const accountSchema = {
  type: "object",
  nullable: true,
  properties: {
    id: {
      type: "string",
      format: "ObjectId",
      example: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    },
    addressStatus: { type: "string" },
  },
};

export const depositSchema = {
  type: "object",
  nullable: true,
  properties: {
    id: {
      type: "string",
      format: "ObjectId",
      example: "2-1-2",
    },
    type: { type: "string", example: "fungible" },
    txHash: {
      type: "string",
      example:
        "0x9f464d3b3c85b007aef6950dbccff03e6a450a059f853802d4e7f9d4e4c8c4e2",
    },
    blockNumber: { type: "string", example: "12984756" },
    depositData: { type: "string", example: "0x1234567890abcdef" },
    handlerResponse: {
      type: "string",
      nullable: true,
      example: "0x1234567890abcdef",
    },
    timestamp: {
      type: "string",
      format: "date-time",
      nullable: true,
      example: "2024-04-02T12:00:00Z",
    },
    fee: { ...feeSchema },
    accountID: {
      type: "string",
      format: "ObjectId",
      nullable: true,
      example: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    },
    account: { ...accountSchema },
    depositNonce: { type: "string", example: "2" },
    resource: { ...resourceSchema },
    resourceID: {
      type: "string",
      format: "ObjectId",
      example:
        "0x0000000000000000000000000000000000000000000000000000000000000300",
    },
    fromDomainID: { type: "string", example: "1" },
    fromDomain: { ...domainSchema },
    toDomainID: { type: "string", nullable: true, example: "2" },
    toDomain: { ...domainSchema },
    destination: {
      type: "string",
      nullable: true,
      example: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    },
    amount: { type: "string", example: "0.0001" },
  },
};

export const executionSchema = {
  type: "object",
  nullable: true,
  properties: {
    id: {
      type: "string",
      format: "ObjectId",
      example: "2-1-2",
    },
    txHash: {
      type: "string",
      example:
        "0x6b0c56d1ad5144a4bdaa7a067f8c002a7d2ad4e9f8cc00e4b4d7e6cfe1b7a8a8",
    },
    blockNumber: { type: "string", example: "12984799" },
    timestamp: {
      type: "string",
      format: "date-time",
      nullable: true,
      example: "2024-04-02T12:00:00Z",
    },
    message: { type: "string", nullable: true, example: "" },
  },
};

export const transferSchema = {
  type: "object",
  properties: {
    id: {
      type: "string",
      format: "ObjectId",
      example: "2-1-2",
    },
    status: { ...transferStatusSchema },
    deposit: { ...depositSchema },
    execution: { ...executionSchema },
  },
};

export const paginationSchema = {
  page: {
    type: "number",
    default: 1,
  },
  limit: {
    type: "number",
    default: 10,
  },
};

export const transferByTxHashSchema = {
  type: {
    type: "string",
    enum: ["deposit", "execution"],
    default: "deposit",
  },
  txHash: { type: "string" },
};

export const transfersBySenderSchema = {
  sender: { type: "string" },
};
