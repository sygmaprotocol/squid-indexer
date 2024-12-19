/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import { domainSchema } from ".";

export const domainsSchema = {
  summary: "Get domains",
  response: {
    200: {
      description: "List of domains",
      content: {
        "application/json": {
          schema: {
            type: "array",
            items: {
              ...domainSchema,
            },
          },
        },
      },
    },
  },
};
