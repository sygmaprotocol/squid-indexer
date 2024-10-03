/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/

export function generateTransferID(
  depositNonce: string,
  fromDomainID: string,
  toDomainID: string,
): string {
  return depositNonce + "-" + fromDomainID + "-" + toDomainID;
}
