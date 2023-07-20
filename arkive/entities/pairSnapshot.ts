
import { createEntity } from "../deps.ts";
import { Types } from 'npm:mongoose'

interface IPairSnapshot {
	res: '1h' | '1d' | '10m'
	pair: any,
	from: number,
	to: number,
	totalSupply: number,
	reserve0: number,
	reserve1: number,
	managed0: number,
	managed1: number,
	fees0: number,
	fees1: number,
	volumeUSD: number,
	swapApr: number,
	managedApy: number,
	managedRewardApy: number,
}

export const PairSnapshot = createEntity<IPairSnapshot>("PairSnapshot", {
	res: String,
	pair: { type: Types.ObjectId, ref: 'Pair'},
	from: { type: Number, index: true },
	to: { type: Number, index: true },
	totalSupply: Number,
	reserve0: Number,
	reserve1: Number,
	managed0: Number,
	managed1: Number,
	fees0: Number,
	fees1: Number,
	volumeUSD: Number,
	swapApr: Number,
	managedApy: Number,
	managedRewardApy: Number,
})