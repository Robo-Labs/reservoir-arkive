
import { createEntity } from "../deps.ts";
import { Types } from 'npm:mongoose'

interface ISnapshot {
	res: '1h' | '1d'
	pair: any,
	from: number,
	to: number,
	totalSupply: number,
	reserve0: number,
	reserve1: number,
	fees0: number,
	fees1: number,
	swapApy: number,
	underlyingApy: number,
	volumeUSD: number,
}

export const Snapshot = createEntity<ISnapshot>("Snapshot", {
	res: String,
	pair: { type: Types.ObjectId, ref: 'Pair'},
	from: { type: Number, index: true },
	to: { type: Number, index: true },
	totalSupply: Number,
	reserve0: Number,
	reserve1: Number,
	fees0: Number,
	fees1: Number,
	swapApy: Number,
	underlyingApy: Number,
	volumeUSD: Number,
})