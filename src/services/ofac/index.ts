/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import url from "url";

import { logger } from "../../utils/logger";

type ChainAnalysisIdentification = {
  category: string;
  name: string;
  description: string;
  url: string;
};

type ChainAnalysisResponse = {
  identifications: Array<ChainAnalysisIdentification> | [];
};

enum AddressStatus {
  OFAC = "ofac",
}

export class OfacComplianceService {
  private chainAnalysisUrl: string;
  private chainAnalysisApiKey: string;

  constructor(chainAnalysisUrl: string, chainAnalisysApiKey: string) {
    this.chainAnalysisUrl = chainAnalysisUrl;
    this.chainAnalysisApiKey = chainAnalisysApiKey;
  }

  public async checkSanctionedAddress(address: string): Promise<string> {
    try {
      const urlToUse = url.resolve(this.chainAnalysisUrl, address);

      const response = await fetch(urlToUse, {
        headers: {
          "X-API-Key": `${this.chainAnalysisApiKey}`,
          Accept: "application/json",
        },
      });
      const data = (await response.json()) as ChainAnalysisResponse;

      if (response.status !== 200) {
        throw new Error(
          `Chain Analysis API returned status ${response.status}`,
        );
      }
      return data.identifications.length ? AddressStatus.OFAC : "";
    } catch (error) {
      logger.error(`Checking address failed: ${(error as Error).message}`);
      return "";
    }
  }
}
