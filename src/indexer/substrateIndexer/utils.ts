/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import { ApiPromise, WsProvider } from "@polkadot/api";

export async function createSubstrateProvider(
  rpcUrl: string,
): Promise<ApiPromise> {
  const wsProvider = new WsProvider(rpcUrl);
  const api = await ApiPromise.create({
    provider: wsProvider,
  });
  return api;
}
