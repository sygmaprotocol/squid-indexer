/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import type { BigNumber } from "@ethersproject/bignumber";
import { AbiCoder, formatEther } from "ethers";

export function getDecodedAmount(depositData: string): string {
  const abiCoder = AbiCoder.defaultAbiCoder();
  const parsedAmount = `0x${depositData.substring(2).slice(0, 64)}`;
  const decodedDepositData = abiCoder.decode(["uint256"], parsedAmount);
  return formatEther((decodedDepositData[0] as BigNumber).toString());
}
