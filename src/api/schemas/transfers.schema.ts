import { paginationSchema, transferSchema, transferStatusSchema } from ".";

export const transfersSchema = {
  summary: "Get all transfers (ordered by time)",
  querystring: {
    type: "object",
    properties: {
      ...paginationSchema,
      ...transferStatusSchema,
    },
  },
  response: {
    200: {
      description: "List of transfers",
      content: {
        "application/json": {
          schema: {
            type: "array",
            items: {
              ...transferSchema,
            },
          },
        },
      },
    },
  },
};

export const transfersBySenderSchema = {
  summary: "Get all transfers initiated by a specific sender",
  querystring: {
    type: "object",
    properties: {
      ...paginationSchema,
    },
  },
  params: {
    type: "object",
    properties: {
      senderAddress: { type: "string" },
    },
  },
  response: {
    200: {
      description: "List of transfers",
      content: {
        "application/json": {
          schema: {
            type: "array",
            items: {
              ...transferSchema,
            },
          },
        },
      },
    },
  },
};

export const transferByTxHashSchema = {
  summary: "Get a specific transfer by transaction hash",
  querystring: {
    type: "object",
    properties: {
      domainID: { type: "number" },
      type: {
        type: "string",
        enum: ["deposit", "execution"],
        default: "deposit",
      },
      ...paginationSchema,
    },
  },
  params: {
    type: "object",
    properties: {
      txHash: { type: "string" },
    },
  },
  response: {
    200: {
      description: "Transfer",
      content: {
        "application/json": {
          schema: {
            type: "array",
            items: {
              ...transferSchema,
            },
          },
        },
      },
    },
  },
};
