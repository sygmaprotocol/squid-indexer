/*
The Licensed Work is (c) 2023 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import { Contract, Provider } from "ethers"
import ERC20Contract from "@openzeppelin/contracts/build/contracts/ERC20.json"
import * as FeeHandlerRouter from "../../abi/FeeHandlerRouter.json"


export function getERC20Contract(provider: Provider, contractAddress: string): Contract {
    return new Contract(contractAddress, ERC20Contract.abi, provider)
}

export function getFeeRouterContract(provider: Provider, contractAddress: string): Contract {
    return new Contract(contractAddress, FeeHandlerRouter.abi, provider)
}