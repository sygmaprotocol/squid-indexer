/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import {sts, Block, Bytes, Option, Result, CallType, RuntimeCtx} from '../support'
import * as v1250 from '../v1250'
import * as v1260 from '../v1260'

export const setFeeHandler =  {
    name: 'SygmaFeeHandlerRouter.set_fee_handler',
    /**
     * Set fee handler specific (domain, asset) pair
     */
    v1250: new CallType(
        'SygmaFeeHandlerRouter.set_fee_handler',
        sts.struct({
            domain: sts.number(),
            asset: v1250.V3AssetId,
            handlerType: v1250.FeeHandlerType,
        })
    ),
    /**
     * See [`Pallet::set_fee_handler`].
     */
    v1260: new CallType(
        'SygmaFeeHandlerRouter.set_fee_handler',
        sts.struct({
            domain: sts.number(),
            asset: v1260.V3AssetId,
            handlerType: v1260.FeeHandlerType,
        })
    ),
}

export type Call = {
    args: {
      asset: ConcreteAsset;
      [key: string]: any; // Allow additional properties in args
    };
    [key: string]: any; // Allow additional properties in Call
  }
  
  export type ConcreteAsset = {
    __kind: "Concrete";
    value: {
      parents: number;
      interior: {
        __kind: "Here" | string; // Adjust if more values for __kind are possible
      };
    };
  }