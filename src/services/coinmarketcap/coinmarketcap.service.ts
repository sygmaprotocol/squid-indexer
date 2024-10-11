/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/

import path from "path";

import { BigNumber } from "bignumber.js";
import type { MemoryCache } from "cache-manager";

import { DepositType } from "../../evmIndexer/evmTypes";
import { fetchRetry } from "../../utils";
import { logger } from "../../utils/logger";

export type CoinMaketCapResponse = {
  id: number;
  symbol: string;
  name: string;
  amount: number;
  last_updated: string;
  quote: {
    USD: {
      price: BigNumber;
      last_updated: string;
    };
  };
};

class CoinMarketCapService {
  private coinMarketCapApiKey: string;
  private coinMarketCapUrl: string;
  private memoryCache: MemoryCache;

  constructor(
    coinMarketCapKey: string,
    coinMarketCapApiUrl: string,
    memoryCache: MemoryCache,
  ) {
    this.coinMarketCapApiKey = coinMarketCapKey;
    this.coinMarketCapUrl = coinMarketCapApiUrl;
    this.memoryCache = memoryCache;
  }

  private async getValueConvertion(
    amount: string,
    tokenSymbol: string,
  ): Promise<CoinMaketCapResponse["quote"]["USD"]["price"]> {
    const tokenValue: BigNumber | undefined =
      await this.memoryCache.get(tokenSymbol);
    if (tokenValue) {
      return BigNumber(amount).times(tokenValue);
    }

    const url = path.join(
      this.coinMarketCapUrl,
      `/v2/tools/price-conversion?amount=1&symbol=${tokenSymbol}&convert=USD`,
    );
    logger.debug(`Calling CoinMarketCap service with URL: ${url}`);
    try {
      const response = await fetchRetry(url, {
        method: "GET",
        headers: {
          "X-CMC_PRO_API_KEY": this.coinMarketCapApiKey,
        },
      });

      const {
        data: [res],
      } = (await response.json()) as { data: CoinMaketCapResponse[] };
      await this.memoryCache.set(tokenSymbol, res.quote.USD.price);
      return BigNumber(amount).times(BigNumber(res.quote.USD.price));
    } catch (err) {
      if (err instanceof Error) {
        logger.error(err.message);
      }
      throw new Error("Error getting value from CoinMarketCap");
    }
  }

  public async getValueInUSD(
    amount: string,
    tokenSymbol: string,
    resourceType: DepositType,
  ): Promise<number | undefined> {
    if (resourceType !== DepositType.FUNGIBLE) {
      return undefined;
    } else {
      try {
        const convertedValue = await this.getValueConvertion(
          amount,
          tokenSymbol,
        );
        return convertedValue.toNumber();
      } catch (error) {
        logger.error((error as Error).message);
        return 0;
      }
    }
  }
}

export default CoinMarketCapService;
