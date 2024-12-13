/*
The Licensed Work is (c) 2023 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import { expect } from "chai";
import { Network, ResourceType } from "@buildwithsygma/core";
import { parseDestination } from "../../src/indexer/utils";

describe("Parse destination", function () {

  it("should parse evm destination for fungible evm deposit log", async function () {
    const hexData =
      "0x000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000145c1f5961696bad2e73f73417f07ef55c62a2dc5b0102";

    const destination = parseDestination(
      Network.EVM,
      hexData,
      ResourceType.FUNGIBLE
    );
    expect(destination).to.be.deep.equal(
      "0x5c1f5961696bad2e73f73417f07ef55c62a2dc5b"
    );
  });

  it("should parse evm destination for GMP evm deposit log", async function () {
    const hexData =
      "0x000000000000000000000000000000000000000000000000000000000007a1200004a271ced214dee6b4c59e3a0f0088878aeccf849a49031eed30140ae5594f4b6833e488bf6c4c9e94c246d90abfdb0000000000000000000000000000000000000000000000000000018b3d2082f5";

    const destination = parseDestination(
      Network.EVM,
      hexData,
      ResourceType.PERMISSIONLESS_GENERIC
    );
    expect(destination).to.be.deep.equal(
      "0xdee6b4c59e3a0f0088878aeccf849a49031eed30"
    );
  });

  it("should parse substrate destination for evm deposit log", async () => {
    const hexData =
      "0x00000000000000000000000000000000000000000000000000005af3107a4000000000000000000000000000000000000000000000000000000000000000002400010100d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d";

    const destination = parseDestination(
      Network.SUBSTRATE,
      hexData,
      ResourceType.FUNGIBLE
    );
    expect(destination).to.equal(
      "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
    );
  });

  it("should return an empty string when junctions.accountId32 is not present", async () => {
    const hexData = "0x000000";
    const result = parseDestination(
      Network.SUBSTRATE,
      hexData,
      ResourceType.FUNGIBLE
    );
    expect(result).to.equal("");
  });
});
