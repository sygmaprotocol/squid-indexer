/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type { Route } from "./types";

export const routesTestnet: Map<string, Route[]> = new Map([
  [
    "2",
    [
      {
        fromDomainId: "2",
        toDomainId: "5",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000200",
        type: "nonfungible",
      },
      {
        fromDomainId: "2",
        toDomainId: "5",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000300",
        type: "fungible",
      },
      {
        fromDomainId: "2",
        toDomainId: "5",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000400",
        type: "semifungible",
      },
      {
        fromDomainId: "2",
        toDomainId: "5",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "2",
        toDomainId: "6",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "2",
        toDomainId: "6",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000700",
        type: "fungible",
      },
      {
        fromDomainId: "2",
        toDomainId: "8",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "2",
        toDomainId: "9",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "2",
        toDomainId: "10",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "2",
        toDomainId: "10",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000001100",
        type: "fungible",
      },
      {
        fromDomainId: "2",
        toDomainId: "11",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "2",
        toDomainId: "11",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000300",
        type: "fungible",
      },
      {
        fromDomainId: "2",
        toDomainId: "12",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000001100",
        type: "fungible",
      },
      {
        fromDomainId: "2",
        toDomainId: "12",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000002000",
        type: "fungible",
      },
      {
        fromDomainId: "2",
        toDomainId: "12",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000001000",
        type: "fungible",
      },
      {
        fromDomainId: "2",
        toDomainId: "13",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000700",
        type: "fungible",
      },
      {
        fromDomainId: "2",
        toDomainId: "15",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "2",
        toDomainId: "10",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000003000",
        type: "fungible",
      },
      {
        fromDomainId: "2",
        toDomainId: "15",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000003000",
        type: "fungible",
      },
      {
        fromDomainId: "2",
        toDomainId: "10",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000001200",
        type: "fungible",
      },
      {
        fromDomainId: "2",
        toDomainId: "13",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000001200",
        type: "fungible",
      },
    ],
  ],
  [
    "5",
    [
      {
        fromDomainId: "5",
        toDomainId: "2",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000200",
        type: "nonfungible",
      },
      {
        fromDomainId: "5",
        toDomainId: "2",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000300",
        type: "fungible",
      },
      {
        fromDomainId: "5",
        toDomainId: "2",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000400",
        type: "semifungible",
      },
      {
        fromDomainId: "5",
        toDomainId: "2",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "5",
        toDomainId: "6",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "5",
        toDomainId: "8",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "5",
        toDomainId: "9",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "5",
        toDomainId: "11",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "5",
        toDomainId: "11",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000300",
        type: "fungible",
      },
      {
        fromDomainId: "5",
        toDomainId: "15",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
    ],
  ],
  [
    "6",
    [
      {
        fromDomainId: "6",
        toDomainId: "2",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000700",
        type: "fungible",
      },
      {
        fromDomainId: "6",
        toDomainId: "2",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "6",
        toDomainId: "5",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "6",
        toDomainId: "8",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "6",
        toDomainId: "9",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "6",
        toDomainId: "10",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "6",
        toDomainId: "11",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "6",
        toDomainId: "13",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000700",
        type: "fungible",
      },
      {
        fromDomainId: "6",
        toDomainId: "15",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
    ],
  ],
  [
    "8",
    [
      {
        fromDomainId: "8",
        toDomainId: "2",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "8",
        toDomainId: "5",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "8",
        toDomainId: "6",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "8",
        toDomainId: "9",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "8",
        toDomainId: "10",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "8",
        toDomainId: "11",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "8",
        toDomainId: "15",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
    ],
  ],
  [
    "9",
    [
      {
        fromDomainId: "9",
        toDomainId: "2",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "9",
        toDomainId: "5",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "9",
        toDomainId: "6",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "9",
        toDomainId: "8",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "9",
        toDomainId: "10",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "9",
        toDomainId: "11",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "9",
        toDomainId: "15",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
    ],
  ],
  [
    "10",
    [
      {
        fromDomainId: "10",
        toDomainId: "2",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000001100",
        type: "fungible",
      },
      {
        fromDomainId: "10",
        toDomainId: "2",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "10",
        toDomainId: "5",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "10",
        toDomainId: "6",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "10",
        toDomainId: "8",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "10",
        toDomainId: "9",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "10",
        toDomainId: "11",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "10",
        toDomainId: "12",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000001100",
        type: "fungible",
      },
      {
        fromDomainId: "10",
        toDomainId: "15",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "10",
        toDomainId: "2",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000001200",
        type: "fungible",
      },
      {
        fromDomainId: "10",
        toDomainId: "15",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000001200",
        type: "fungible",
      },
      {
        fromDomainId: "10",
        toDomainId: "2",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000003000",
        type: "fungible",
      },
      {
        fromDomainId: "10",
        toDomainId: "15",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000003000",
        type: "fungible",
      },
    ],
  ],
  [
    "11",
    [
      {
        fromDomainId: "10",
        toDomainId: "2",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000300",
        type: "fungible",
      },
      {
        fromDomainId: "10",
        toDomainId: "2",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "10",
        toDomainId: "5",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000300",
        type: "fungible",
      },
      {
        fromDomainId: "10",
        toDomainId: "5",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "10",
        toDomainId: "6",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "10",
        toDomainId: "8",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "10",
        toDomainId: "9",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "10",
        toDomainId: "10",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "10",
        toDomainId: "15",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
    ],
  ],
  [
    "12",
    [
      {
        fromDomainId: "12",
        toDomainId: "2",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000002000",
        type: "fungible",
      },
      {
        fromDomainId: "12",
        toDomainId: "2",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000001100",
        type: "fungible",
      },
      {
        fromDomainId: "12",
        toDomainId: "2",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000001000",
        type: "fungible",
      },
      {
        fromDomainId: "12",
        toDomainId: "10",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000001100",
        type: "fungible",
      },
    ],
  ],
  [
    "13",
    [
      {
        fromDomainId: "13",
        toDomainId: "2",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000700",
        type: "fungible",
      },
      {
        fromDomainId: "13",
        toDomainId: "6",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000700",
        type: "fungible",
      },
      {
        fromDomainId: "13",
        toDomainId: "16",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000700",
        type: "fungible",
      },
    ],
  ],
  [
    "15",
    [
      {
        fromDomainId: "15",
        toDomainId: "2",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "15",
        toDomainId: "5",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "15",
        toDomainId: "6",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "15",
        toDomainId: "8",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "15",
        toDomainId: "9",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "15",
        toDomainId: "10",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "15",
        toDomainId: "11",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000600",
        type: "gmp",
      },
      {
        fromDomainId: "15",
        toDomainId: "2",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000001200",
        type: "fungible",
      },
      {
        fromDomainId: "15",
        toDomainId: "10",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000001200",
        type: "fungible",
      },
      {
        fromDomainId: "15",
        toDomainId: "2",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000003000",
        type: "fungible",
      },
      {
        fromDomainId: "15",
        toDomainId: "10",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000003000",
        type: "fungible",
      },
    ],
  ],
  [
    "16",
    [
      {
        fromDomainId: "16",
        toDomainId: "13",
        resourceId:
          "0x0000000000000000000000000000000000000000000000000000000000000700",
        type: "fungible",
      },
    ],
  ],
]);