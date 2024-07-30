/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import * as p from "@subsquid/evm-codec";
import { event, fun, viewFun, indexed, ContractBase } from "@subsquid/evm-abi";
import type {
  EventParams as EParams,
  FunctionArguments,
  FunctionReturn,
} from "@subsquid/evm-abi";

export const events = {
  AccessControlChanged: event(
    "0x497acaa34ac19c2a2a579ad43eca493b4fea820459e254e9383e7dda216b0f04",
    "AccessControlChanged(address)",
    { newAccessControl: p.address }
  ),
  Deposit: event(
    "0x17bc3181e17a9620a479c24e6c606e474ba84fc036877b768926872e8cd0e11f",
    "Deposit(uint8,bytes32,uint64,address,bytes,bytes)",
    {
      destinationDomainID: p.uint8,
      resourceID: p.bytes32,
      depositNonce: p.uint64,
      user: indexed(p.address),
      data: p.bytes,
      handlerResponse: p.bytes,
    }
  ),
  EndKeygen: event(
    "0x4187686ceef7b541a1f224d48d4cded8f2c535e0e58ac0f0514071b1de3dad57",
    "EndKeygen()",
    {}
  ),
  FailedHandlerExecution: event(
    "0x19f774a63ee465292252a9981ae52051acc13da671c698ac4b5bf25b38c5b6fc",
    "FailedHandlerExecution(bytes,uint8,uint64)",
    { lowLevelData: p.bytes, originDomainID: p.uint8, depositNonce: p.uint64 }
  ),
  FeeHandlerChanged: event(
    "0x729170bd142e4965055b26a285faeedf03baf2b915bfc5a7c75d24b45815ff2c",
    "FeeHandlerChanged(address)",
    { newFeeHandler: p.address }
  ),
  KeyRefresh: event(
    "0xe78d813a9260522f81d6c761e311727b2e19008daadd2b9e174be86bc4f06a4b",
    "KeyRefresh(string)",
    { hash: p.string }
  ),
  Paused: event(
    "0x62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a258",
    "Paused(address)",
    { account: p.address }
  ),
  ProposalExecution: event(
    "0xb83128682faafdf78efbb57c4c9acdc12ba648a50eca00b8b72818ea2d8e5cf9",
    "ProposalExecution(uint8,uint64,bytes32,bytes)",
    {
      originDomainID: p.uint8,
      depositNonce: p.uint64,
      dataHash: p.bytes32,
      handlerResponse: p.bytes,
    }
  ),
  Retry: event(
    "0x9069464c059b9a90135a3fdf2c47855263346b912894ad7562d989532c3fad4c",
    "Retry(string)",
    { txHash: p.string }
  ),
  StartKeygen: event(
    "0x24e723a5c27b62883404028b8dee9965934de6a46828cda2ff63bf9a5e65ce43",
    "StartKeygen()",
    {}
  ),
  Unpaused: event(
    "0x5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa",
    "Unpaused(address)",
    { account: p.address }
  ),
};

export const functions = {
  _MPCAddress: viewFun("0x059972d2", "_MPCAddress()", {}, p.address),
  _accessControl: viewFun("0x44e8e430", "_accessControl()", {}, p.address),
  _depositCounts: viewFun(
    "0x4b0b919d",
    "_depositCounts(uint8)",
    { _0: p.uint8 },
    p.uint64
  ),
  _domainID: viewFun("0x9dd694f4", "_domainID()", {}, p.uint8),
  _feeHandler: viewFun("0xfe4648f4", "_feeHandler()", {}, p.address),
  _resourceIDToHandlerAddress: viewFun(
    "0x84db809f",
    "_resourceIDToHandlerAddress(bytes32)",
    { _0: p.bytes32 },
    p.address
  ),
  adminChangeAccessControl: fun(
    "0x9d33b6d4",
    "adminChangeAccessControl(address)",
    { newAccessControl: p.address }
  ),
  adminChangeFeeHandler: fun("0x8b63aebf", "adminChangeFeeHandler(address)", {
    newFeeHandler: p.address,
  }),
  adminPauseTransfers: fun("0x80ae1c28", "adminPauseTransfers()", {}),
  adminSetBurnable: fun("0x8c0c2631", "adminSetBurnable(address,address)", {
    handlerAddress: p.address,
    tokenAddress: p.address,
  }),
  adminSetDepositNonce: fun(
    "0xedc20c3c",
    "adminSetDepositNonce(uint8,uint64)",
    { domainID: p.uint8, nonce: p.uint64 }
  ),
  adminSetForwarder: fun("0xd15ef64e", "adminSetForwarder(address,bool)", {
    forwarder: p.address,
    valid: p.bool,
  }),
  adminSetResource: fun(
    "0x8a3234c7",
    "adminSetResource(address,bytes32,address,bytes)",
    {
      handlerAddress: p.address,
      resourceID: p.bytes32,
      contractAddress: p.address,
      args: p.bytes,
    }
  ),
  adminUnpauseTransfers: fun("0xffaac0eb", "adminUnpauseTransfers()", {}),
  adminWithdraw: fun("0xbd2a1820", "adminWithdraw(address,bytes)", {
    handlerAddress: p.address,
    data: p.bytes,
  }),
  deposit: fun(
    "0x73c45c98",
    "deposit(uint8,bytes32,bytes,bytes)",
    {
      destinationDomainID: p.uint8,
      resourceID: p.bytes32,
      depositData: p.bytes,
      feeData: p.bytes,
    },
    { depositNonce: p.uint64, handlerResponse: p.bytes }
  ),
  endKeygen: fun("0xd2e5fae9", "endKeygen(address)", { MPCAddress: p.address }),
  executeProposal: fun(
    "0xf0ead51e",
    "executeProposal((uint8,uint64,bytes32,bytes),bytes)",
    {
      proposal: p.struct({
        originDomainID: p.uint8,
        depositNonce: p.uint64,
        resourceID: p.bytes32,
        data: p.bytes,
      }),
      signature: p.bytes,
    }
  ),
  executeProposals: fun(
    "0x1f5c64c1",
    "executeProposals((uint8,uint64,bytes32,bytes)[],bytes)",
    {
      proposals: p.array(
        p.struct({
          originDomainID: p.uint8,
          depositNonce: p.uint64,
          resourceID: p.bytes32,
          data: p.bytes,
        })
      ),
      signature: p.bytes,
    }
  ),
  isProposalExecuted: viewFun(
    "0x9ae0bf45",
    "isProposalExecuted(uint8,uint256)",
    { domainID: p.uint8, depositNonce: p.uint256 },
    p.bool
  ),
  isValidForwarder: viewFun(
    "0xf8c39e44",
    "isValidForwarder(address)",
    { _0: p.address },
    p.bool
  ),
  paused: viewFun("0x5c975abb", "paused()", {}, p.bool),
  refreshKey: fun("0xd8236744", "refreshKey(string)", { hash: p.string }),
  retry: fun("0x366b4885", "retry(string)", { txHash: p.string }),
  startKeygen: fun("0x6ba6db6b", "startKeygen()", {}),
  usedNonces: viewFun(
    "0x08a64104",
    "usedNonces(uint8,uint256)",
    { _0: p.uint8, _1: p.uint256 },
    p.uint256
  ),
  verify: viewFun(
    "0xa546e8a1",
    "verify((uint8,uint64,bytes32,bytes)[],bytes)",
    {
      proposals: p.array(
        p.struct({
          originDomainID: p.uint8,
          depositNonce: p.uint64,
          resourceID: p.bytes32,
          data: p.bytes,
        })
      ),
      signature: p.bytes,
    },
    p.bool
  ),
};

export class Contract extends ContractBase {
  _MPCAddress() {
    return this.eth_call(functions._MPCAddress, {});
  }

  _accessControl() {
    return this.eth_call(functions._accessControl, {});
  }

  _depositCounts(_0: _depositCountsParams["_0"]) {
    return this.eth_call(functions._depositCounts, { _0 });
  }

  _domainID() {
    return this.eth_call(functions._domainID, {});
  }

  _feeHandler() {
    return this.eth_call(functions._feeHandler, {});
  }

  _resourceIDToHandlerAddress(_0: _resourceIDToHandlerAddressParams["_0"]) {
    return this.eth_call(functions._resourceIDToHandlerAddress, { _0 });
  }

  isProposalExecuted(
    domainID: IsProposalExecutedParams["domainID"],
    depositNonce: IsProposalExecutedParams["depositNonce"]
  ) {
    return this.eth_call(functions.isProposalExecuted, {
      domainID,
      depositNonce,
    });
  }

  isValidForwarder(_0: IsValidForwarderParams["_0"]) {
    return this.eth_call(functions.isValidForwarder, { _0 });
  }

  paused() {
    return this.eth_call(functions.paused, {});
  }

  usedNonces(_0: UsedNoncesParams["_0"], _1: UsedNoncesParams["_1"]) {
    return this.eth_call(functions.usedNonces, { _0, _1 });
  }

  verify(
    proposals: VerifyParams["proposals"],
    signature: VerifyParams["signature"]
  ) {
    return this.eth_call(functions.verify, { proposals, signature });
  }
}

/// Event types
export type AccessControlChangedEventArgs = EParams<
  typeof events.AccessControlChanged
>;
export type DepositEventArgs = EParams<typeof events.Deposit>;
export type EndKeygenEventArgs = EParams<typeof events.EndKeygen>;
export type FailedHandlerExecutionEventArgs = EParams<
  typeof events.FailedHandlerExecution
>;
export type FeeHandlerChangedEventArgs = EParams<
  typeof events.FeeHandlerChanged
>;
export type KeyRefreshEventArgs = EParams<typeof events.KeyRefresh>;
export type PausedEventArgs = EParams<typeof events.Paused>;
export type ProposalExecutionEventArgs = EParams<
  typeof events.ProposalExecution
>;
export type RetryEventArgs = EParams<typeof events.Retry>;
export type StartKeygenEventArgs = EParams<typeof events.StartKeygen>;
export type UnpausedEventArgs = EParams<typeof events.Unpaused>;

/// Function types
export type _MPCAddressParams = FunctionArguments<typeof functions._MPCAddress>;
export type _MPCAddressReturn = FunctionReturn<typeof functions._MPCAddress>;

export type _accessControlParams = FunctionArguments<
  typeof functions._accessControl
>;
export type _accessControlReturn = FunctionReturn<
  typeof functions._accessControl
>;

export type _depositCountsParams = FunctionArguments<
  typeof functions._depositCounts
>;
export type _depositCountsReturn = FunctionReturn<
  typeof functions._depositCounts
>;

export type _domainIDParams = FunctionArguments<typeof functions._domainID>;
export type _domainIDReturn = FunctionReturn<typeof functions._domainID>;

export type _feeHandlerParams = FunctionArguments<typeof functions._feeHandler>;
export type _feeHandlerReturn = FunctionReturn<typeof functions._feeHandler>;

export type _resourceIDToHandlerAddressParams = FunctionArguments<
  typeof functions._resourceIDToHandlerAddress
>;
export type _resourceIDToHandlerAddressReturn = FunctionReturn<
  typeof functions._resourceIDToHandlerAddress
>;

export type AdminChangeAccessControlParams = FunctionArguments<
  typeof functions.adminChangeAccessControl
>;
export type AdminChangeAccessControlReturn = FunctionReturn<
  typeof functions.adminChangeAccessControl
>;

export type AdminChangeFeeHandlerParams = FunctionArguments<
  typeof functions.adminChangeFeeHandler
>;
export type AdminChangeFeeHandlerReturn = FunctionReturn<
  typeof functions.adminChangeFeeHandler
>;

export type AdminPauseTransfersParams = FunctionArguments<
  typeof functions.adminPauseTransfers
>;
export type AdminPauseTransfersReturn = FunctionReturn<
  typeof functions.adminPauseTransfers
>;

export type AdminSetBurnableParams = FunctionArguments<
  typeof functions.adminSetBurnable
>;
export type AdminSetBurnableReturn = FunctionReturn<
  typeof functions.adminSetBurnable
>;

export type AdminSetDepositNonceParams = FunctionArguments<
  typeof functions.adminSetDepositNonce
>;
export type AdminSetDepositNonceReturn = FunctionReturn<
  typeof functions.adminSetDepositNonce
>;

export type AdminSetForwarderParams = FunctionArguments<
  typeof functions.adminSetForwarder
>;
export type AdminSetForwarderReturn = FunctionReturn<
  typeof functions.adminSetForwarder
>;

export type AdminSetResourceParams = FunctionArguments<
  typeof functions.adminSetResource
>;
export type AdminSetResourceReturn = FunctionReturn<
  typeof functions.adminSetResource
>;

export type AdminUnpauseTransfersParams = FunctionArguments<
  typeof functions.adminUnpauseTransfers
>;
export type AdminUnpauseTransfersReturn = FunctionReturn<
  typeof functions.adminUnpauseTransfers
>;

export type AdminWithdrawParams = FunctionArguments<
  typeof functions.adminWithdraw
>;
export type AdminWithdrawReturn = FunctionReturn<
  typeof functions.adminWithdraw
>;

export type DepositParams = FunctionArguments<typeof functions.deposit>;
export type DepositReturn = FunctionReturn<typeof functions.deposit>;

export type EndKeygenParams = FunctionArguments<typeof functions.endKeygen>;
export type EndKeygenReturn = FunctionReturn<typeof functions.endKeygen>;

export type ExecuteProposalParams = FunctionArguments<
  typeof functions.executeProposal
>;
export type ExecuteProposalReturn = FunctionReturn<
  typeof functions.executeProposal
>;

export type ExecuteProposalsParams = FunctionArguments<
  typeof functions.executeProposals
>;
export type ExecuteProposalsReturn = FunctionReturn<
  typeof functions.executeProposals
>;

export type IsProposalExecutedParams = FunctionArguments<
  typeof functions.isProposalExecuted
>;
export type IsProposalExecutedReturn = FunctionReturn<
  typeof functions.isProposalExecuted
>;

export type IsValidForwarderParams = FunctionArguments<
  typeof functions.isValidForwarder
>;
export type IsValidForwarderReturn = FunctionReturn<
  typeof functions.isValidForwarder
>;

export type PausedParams = FunctionArguments<typeof functions.paused>;
export type PausedReturn = FunctionReturn<typeof functions.paused>;

export type RefreshKeyParams = FunctionArguments<typeof functions.refreshKey>;
export type RefreshKeyReturn = FunctionReturn<typeof functions.refreshKey>;

export type RetryParams = FunctionArguments<typeof functions.retry>;
export type RetryReturn = FunctionReturn<typeof functions.retry>;

export type StartKeygenParams = FunctionArguments<typeof functions.startKeygen>;
export type StartKeygenReturn = FunctionReturn<typeof functions.startKeygen>;

export type UsedNoncesParams = FunctionArguments<typeof functions.usedNonces>;
export type UsedNoncesReturn = FunctionReturn<typeof functions.usedNonces>;

export type VerifyParams = FunctionArguments<typeof functions.verify>;
export type VerifyReturn = FunctionReturn<typeof functions.verify>;
