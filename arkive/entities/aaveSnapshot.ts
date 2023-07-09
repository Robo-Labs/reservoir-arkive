
import { createEntity } from "../deps.ts";
import { Types } from 'npm:mongoose'

interface IAaveSnapshot {
	pool: any,
	underlying: any,
	underlyingAddress: string,
	timestamp: number,
	liquidityRate: number,
	variableBorrowRate: number,
	totalSupply: number,
	totalDebt: number,
}

export const AaveSnapshot = createEntity<IAaveSnapshot>("AaveSnapshot", {
	pool: { type: Types.ObjectId, ref: 'Pool'},
	underlying: { type: Types.ObjectId, ref: 'Token'},
	underlyingAddress: String,
	timestamp: { type: Number, index: true },
	liquidityRate: Number,
	variableBorrowRate: Number,
	totalSupply: Number,
	totalDebt: Number,
})