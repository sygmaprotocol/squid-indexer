/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/

import { expect } from "chai";
import { Route } from "../../src/model";

const NUMBER_OF_ROUTES = 6;

describe("Routes tests", function () {
  it("should succesfully fetch all routes", async () => {
    const response = await fetch("http://localhost:8000/api/routes");
    const routes: Array<Route> = await response.json();
    expect(routes.length).to.be.deep.equal(NUMBER_OF_ROUTES);    
    routes.map((route) => {
      expect(route.id).to.be.not.null;
      expect(route.fromDomain).to.be.not.null;
      expect(route.fromDomainID).to.be.not.null;
      expect(route.resource).to.be.not.null;
      expect(route.resourceID).to.be.not.null;
      expect(route.toDomain).to.be.not.null;
      expect(route.toDomainID).to.be.not.null;
    });
  });
});