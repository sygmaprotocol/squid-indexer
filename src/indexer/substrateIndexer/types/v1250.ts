/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import { sts, Result, Option, Bytes, BitSequence } from "./support";

export const TransferType: sts.Type<TransferType> = sts.closedEnum(() => {
  return {
    FungibleTransfer: sts.unit(),
    GenericTransfer: sts.unit(),
    NonFungibleTransfer: sts.unit(),
  };
});

export type TransferType =
  | TransferType_FungibleTransfer
  | TransferType_GenericTransfer
  | TransferType_NonFungibleTransfer;

export interface TransferType_FungibleTransfer {
  __kind: "FungibleTransfer";
}

export interface TransferType_GenericTransfer {
  __kind: "GenericTransfer";
}

export interface TransferType_NonFungibleTransfer {
  __kind: "NonFungibleTransfer";
}

export const AccountId32 = sts.bytes();
