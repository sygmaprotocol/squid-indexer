/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import {
  paginationSchema,
  transferByTxHashSchema,
  transfersBySenderSchema,
  transferSchema,
  transferStatusSchema,
} from ".";

export const transfersSchema = {
  summary: "Get all transfers (ordered by time)",
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
