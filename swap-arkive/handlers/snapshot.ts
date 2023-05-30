import {
	type BlockHandler,
} from "https://deno.land/x/robo_arkiver@v0.3.6/mod.ts";
import { Snapshot } from "../entities/snapshot.ts";
import { Pair } from "../entities/pair.ts";
import { ISwap, Swap } from "../entities/swap.ts";
import { Context, nearestDay, SECONDS_PER_YEAR } from "./util.ts";


const createSnapshot = async (ctx: Context, from: number, to: number, period: string) => {
	const pairs = await Pair.find({})
	return await Promise.all(pairs.map(async (pair: any) => {
		// Get previous snapshot
		const snapshot = await Snapshot.findOne({ pair, res: period, from }) || new Snapshot({
			res: period,
			pair,
			from,
			to,
			totalSupply: 0,
			reserve0: 0,
			reserve1: 0,
			fees0: 0,
			fees1: 0,
			volumeUSD: 0,
			feeApy: 0,
		}) as any

		// Swaps since last snapshot
		const swaps = await Swap.find({ pair, timestamp: { $gte: from, $lt: to } })

		// Calculate the stats for the snapshot
		const volume0 = swaps.reduce((acc: number, swap: ISwap) => acc += swap.amount0In + swap.amount0Out, 0)
		const volume1 = swaps.reduce((acc: number, swap: ISwap) => acc += swap.amount1In + swap.amount1Out, 0)
		const fees0 = volume0 * pair.swapFee
		const fees1 = volume1 * pair.swapFee
		const duration = to - from
		const returns = fees0 / pair.reserve0
		const swapApy = (returns / duration) * SECONDS_PER_YEAR

		// *** TODO ***
		const volumeUSD = 0 // TODO - Use the Token entities to get the price of the tokens and calculate the volumeUSD
		const underlyingApy = 0 // TODO - Get the apy from AAVE. Do a 10minute snapshot of aave and use that. 

		// Update the snapshot
		snapshot.reserve0 = pair.reserve0
		snapshot.reserve1 = pair.reserve1
		snapshot.fees0 = fees0
		snapshot.fees1 = fees1
		snapshot.swapApy = swapApy
		snapshot.underlyingApy = underlyingApy
		snapshot.volumeUSD = volumeUSD
		
		return snapshot

	}))

}

const dailySnapshot = async (ctx: Context): Promise<void> => {
	const now = Number(ctx.block.timestamp)
	const nowDay = nearestDay(now)

	// Update the snapshot everytime, incase their have been trades
	const snapshots = await createSnapshot(ctx, nowDay, now, '1d')
	await Snapshot.bulkSave(snapshots)
}
	
export const SnapshotHandler: BlockHandler = async (ctx: Context): Promise<void> => {
	console.log('SnapshotHandler', ctx.block.number, Number(ctx.block.timestamp))
	await dailySnapshot(ctx)
};