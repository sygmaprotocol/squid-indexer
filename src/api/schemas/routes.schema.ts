/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import { routeSchema } from ".";

export const routesSchema = {
  summary: "Get routes",
  response: {
    200: {
      description: "List of routes",
      content: {
        "application/json": {
          schema: {
            type: "array",
            items: {
              ...routeSchema,
            },
          },
        },
      },
    },
  },
};
