import { createEntity } from "https://deno.land/x/robo_arkiver/mod.ts";
import { Types } from 'npm:mongoose'

export interface ISwap {
	block: number
	timestamp: number
	pairAddress: string
	pair: any
	sender: string
	to: string
	zeroForOne: boolean
	amount0In: number
	amount1Out: number
	amount1In: number
	amount0Out: number
}

export const Swap = createEntity<ISwap>("Swap", {
	block: { type: Number, index: true },
	timestamp: { type: Number, index: true },
	pairAddress: String,
	pair: { type: Types.ObjectId, ref: 'Pair'},
	sender: String,
	to: String,
	zeroForOne: Boolean,
	amount0In: Number,
	amount1Out: Number,
	amount1In: Number,
	amount0Out: Number,
});
