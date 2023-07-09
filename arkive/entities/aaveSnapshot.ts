
import { createEntity } from "../deps.ts";
import { Types } from 'npm:mongoose'

interface IAaveSnapshot {
	pool: any,
	timestamp: number,
	liquidityRate: number,
	variableBorrowRate: number,
	totalSupply: number,
	totalDebt: number,
}

export const AaveSnapshot = createEntity<IAaveSnapshot>("AaveSnapshot", {
	pool: { type: Types.ObjectId, ref: 'Pool'},
	timestamp: { type: Number, index: true },
	liquidityRate: Number,
	variableBorrowRate: Number,
	totalSupply: Number,
	totalDebt: Number,
})