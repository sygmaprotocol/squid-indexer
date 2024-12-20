/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/

import { expect } from "chai";
import { Domain } from "../../src/model";

const NUMBER_OF_DOMAINS = 3;

describe("Domains tests", function () {
  it("should succesfully fetch all domains", async () => {
    const response = await fetch("http://localhost:8000/api/domains");
    const domains: Array<Domain> = await response.json();
    expect(domains.length).to.be.deep.equal(NUMBER_OF_DOMAINS);
    domains.map((domain) => {
      expect(domain.id).to.be.not.null;
      expect(domain.name).to.be.not.null;
      expect(domain.type).to.be.not.null;
      expect(domain.iconURL).to.be.not.null;
      expect(domain.explorerURL).to.be.not.null;
    });
  });
});
