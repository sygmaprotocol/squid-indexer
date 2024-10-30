/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import * as p from '@subsquid/evm-codec'
import { event, fun, viewFun, indexed, ContractBase } from '@subsquid/evm-abi'
import type { EventParams as EParams, FunctionArguments, FunctionReturn } from '@subsquid/evm-abi'

export const events = {
    FeeCollected: event("0xbd231b7fa4103e15e7a238c72f07e8aff310701af121895aa6c793b80245e433", "FeeCollected(address,uint8,uint8,bytes32,uint256,address)", {"sender": p.address, "fromDomainID": p.uint8, "destinationDomainID": p.uint8, "resourceID": p.bytes32, "fee": p.uint256, "tokenAddress": p.address}),
    FeeDistributed: event("0xaaa40a232aaf133fdd28f3485f6fdd163514cfadbffa981f3610f42398efe34b", "FeeDistributed(address,address,uint256)", {"tokenAddress": p.address, "recipient": p.address, "amount": p.uint256}),
    RoleGranted: event("0x2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d", "RoleGranted(bytes32,address,address)", {"role": indexed(p.bytes32), "account": indexed(p.address), "sender": indexed(p.address)}),
    RoleRevoked: event("0xf6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b", "RoleRevoked(bytes32,address,address)", {"role": indexed(p.bytes32), "account": indexed(p.address), "sender": indexed(p.address)}),
    WhitelistChanged: event("0xb840a1dbd8b09a3dc45161bba92dfb9aba643c0e44c085a447f839d1d02cf13b", "WhitelistChanged(address,bool)", {"whitelistAddress": p.address, "isWhitelisted": p.bool}),
}

export const functions = {
    DEFAULT_ADMIN_ROLE: viewFun("0xa217fddf", "DEFAULT_ADMIN_ROLE()", {}, p.bytes32),
    _bridgeAddress: viewFun("0x318c136e", "_bridgeAddress()", {}, p.address),
    _domainResourceIDToFeeHandlerAddress: viewFun("0x3d94ebc6", "_domainResourceIDToFeeHandlerAddress(uint8,bytes32)", {"_0": p.uint8, "_1": p.bytes32}, p.address),
    _whitelist: viewFun("0xcfdb63ac", "_whitelist(address)", {"_0": p.address}, p.bool),
    adminSetResourceHandler: fun("0x1af5fe38", "adminSetResourceHandler(uint8,bytes32,address)", {"destinationDomainID": p.uint8, "resourceID": p.bytes32, "handlerAddress": p.address}, ),
    adminSetWhitelist: fun("0xf1382b26", "adminSetWhitelist(address,bool)", {"whitelistAddress": p.address, "isWhitelisted": p.bool}, ),
    calculateFee: viewFun("0xef4f081f", "calculateFee(address,uint8,uint8,bytes32,bytes,bytes)", {"sender": p.address, "fromDomainID": p.uint8, "destinationDomainID": p.uint8, "resourceID": p.bytes32, "depositData": p.bytes, "feeData": p.bytes}, {"fee": p.uint256, "tokenAddress": p.address}),
    collectFee: fun("0x25307065", "collectFee(address,uint8,uint8,bytes32,bytes,bytes)", {"sender": p.address, "fromDomainID": p.uint8, "destinationDomainID": p.uint8, "resourceID": p.bytes32, "depositData": p.bytes, "feeData": p.bytes}, ),
    getRoleAdmin: viewFun("0x248a9ca3", "getRoleAdmin(bytes32)", {"role": p.bytes32}, p.bytes32),
    getRoleMember: viewFun("0x9010d07c", "getRoleMember(bytes32,uint256)", {"role": p.bytes32, "index": p.uint256}, p.address),
    getRoleMemberCount: viewFun("0xca15c873", "getRoleMemberCount(bytes32)", {"role": p.bytes32}, p.uint256),
    getRoleMemberIndex: viewFun("0x4e0df3f6", "getRoleMemberIndex(bytes32,address)", {"role": p.bytes32, "account": p.address}, p.uint256),
    grantRole: fun("0x2f2ff15d", "grantRole(bytes32,address)", {"role": p.bytes32, "account": p.address}, ),
    hasRole: viewFun("0x91d14854", "hasRole(bytes32,address)", {"role": p.bytes32, "account": p.address}, p.bool),
    renounceRole: fun("0x36568abe", "renounceRole(bytes32,address)", {"role": p.bytes32, "account": p.address}, ),
    revokeRole: fun("0xd547741f", "revokeRole(bytes32,address)", {"role": p.bytes32, "account": p.address}, ),
}

export class Contract extends ContractBase {

    DEFAULT_ADMIN_ROLE() {
        return this.eth_call(functions.DEFAULT_ADMIN_ROLE, {})
    }

    _bridgeAddress() {
        return this.eth_call(functions._bridgeAddress, {})
    }

    _domainResourceIDToFeeHandlerAddress(_0: _domainResourceIDToFeeHandlerAddressParams["_0"], _1: _domainResourceIDToFeeHandlerAddressParams["_1"]) {
        return this.eth_call(functions._domainResourceIDToFeeHandlerAddress, {_0, _1})
    }

    _whitelist(_0: _whitelistParams["_0"]) {
        return this.eth_call(functions._whitelist, {_0})
    }

    calculateFee(sender: CalculateFeeParams["sender"], fromDomainID: CalculateFeeParams["fromDomainID"], destinationDomainID: CalculateFeeParams["destinationDomainID"], resourceID: CalculateFeeParams["resourceID"], depositData: CalculateFeeParams["depositData"], feeData: CalculateFeeParams["feeData"]) {
        return this.eth_call(functions.calculateFee, {sender, fromDomainID, destinationDomainID, resourceID, depositData, feeData})
    }

    getRoleAdmin(role: GetRoleAdminParams["role"]) {
        return this.eth_call(functions.getRoleAdmin, {role})
    }

    getRoleMember(role: GetRoleMemberParams["role"], index: GetRoleMemberParams["index"]) {
        return this.eth_call(functions.getRoleMember, {role, index})
    }

    getRoleMemberCount(role: GetRoleMemberCountParams["role"]) {
        return this.eth_call(functions.getRoleMemberCount, {role})
    }

    getRoleMemberIndex(role: GetRoleMemberIndexParams["role"], account: GetRoleMemberIndexParams["account"]) {
        return this.eth_call(functions.getRoleMemberIndex, {role, account})
    }

    hasRole(role: HasRoleParams["role"], account: HasRoleParams["account"]) {
        return this.eth_call(functions.hasRole, {role, account})
    }
}

/// Event types
export type FeeCollectedEventArgs = EParams<typeof events.FeeCollected>
export type FeeDistributedEventArgs = EParams<typeof events.FeeDistributed>
export type RoleGrantedEventArgs = EParams<typeof events.RoleGranted>
export type RoleRevokedEventArgs = EParams<typeof events.RoleRevoked>
export type WhitelistChangedEventArgs = EParams<typeof events.WhitelistChanged>

/// Function types
export type DEFAULT_ADMIN_ROLEParams = FunctionArguments<typeof functions.DEFAULT_ADMIN_ROLE>
export type DEFAULT_ADMIN_ROLEReturn = FunctionReturn<typeof functions.DEFAULT_ADMIN_ROLE>

export type _bridgeAddressParams = FunctionArguments<typeof functions._bridgeAddress>
export type _bridgeAddressReturn = FunctionReturn<typeof functions._bridgeAddress>

export type _domainResourceIDToFeeHandlerAddressParams = FunctionArguments<typeof functions._domainResourceIDToFeeHandlerAddress>
export type _domainResourceIDToFeeHandlerAddressReturn = FunctionReturn<typeof functions._domainResourceIDToFeeHandlerAddress>

export type _whitelistParams = FunctionArguments<typeof functions._whitelist>
export type _whitelistReturn = FunctionReturn<typeof functions._whitelist>

export type AdminSetResourceHandlerParams = FunctionArguments<typeof functions.adminSetResourceHandler>
export type AdminSetResourceHandlerReturn = FunctionReturn<typeof functions.adminSetResourceHandler>

export type AdminSetWhitelistParams = FunctionArguments<typeof functions.adminSetWhitelist>
export type AdminSetWhitelistReturn = FunctionReturn<typeof functions.adminSetWhitelist>

export type CalculateFeeParams = FunctionArguments<typeof functions.calculateFee>
export type CalculateFeeReturn = FunctionReturn<typeof functions.calculateFee>

export type CollectFeeParams = FunctionArguments<typeof functions.collectFee>
export type CollectFeeReturn = FunctionReturn<typeof functions.collectFee>

export type GetRoleAdminParams = FunctionArguments<typeof functions.getRoleAdmin>
export type GetRoleAdminReturn = FunctionReturn<typeof functions.getRoleAdmin>

export type GetRoleMemberParams = FunctionArguments<typeof functions.getRoleMember>
export type GetRoleMemberReturn = FunctionReturn<typeof functions.getRoleMember>

export type GetRoleMemberCountParams = FunctionArguments<typeof functions.getRoleMemberCount>
export type GetRoleMemberCountReturn = FunctionReturn<typeof functions.getRoleMemberCount>

export type GetRoleMemberIndexParams = FunctionArguments<typeof functions.getRoleMemberIndex>
export type GetRoleMemberIndexReturn = FunctionReturn<typeof functions.getRoleMemberIndex>

export type GrantRoleParams = FunctionArguments<typeof functions.grantRole>
export type GrantRoleReturn = FunctionReturn<typeof functions.grantRole>

export type HasRoleParams = FunctionArguments<typeof functions.hasRole>
export type HasRoleReturn = FunctionReturn<typeof functions.hasRole>

export type RenounceRoleParams = FunctionArguments<typeof functions.renounceRole>
export type RenounceRoleReturn = FunctionReturn<typeof functions.renounceRole>

export type RevokeRoleParams = FunctionArguments<typeof functions.revokeRole>
export type RevokeRoleReturn = FunctionReturn<typeof functions.revokeRole>

