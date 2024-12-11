/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import { paginationSchema, transferSchema, transferStatusSchema } from ".";

const transferByTxHashSchema = {
  component: {
    type: "string",
    enum: ["deposit", "execution"],
    default: "deposit",
  },
  txHash: { type: "string" },
};

const transfersBySenderSchema = {
  sender: { type: "string" },
};

export const transfersSchema = {
  summary: "Get transfers (ordered by time)",
  querystring: {
    type: "object",
    properties: {
      ...paginationSchema,
      ...transferStatusSchema,
      ...transferByTxHashSchema,
      ...transfersBySenderSchema,
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
