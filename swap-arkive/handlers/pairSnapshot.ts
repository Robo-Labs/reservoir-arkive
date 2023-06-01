import {
	type BlockHandler,
} from "https://deno.land/x/robo_arkiver@v0.4.11/mod.ts";
import { IPair, Pair } from "../entities/pair.ts";
import { ISwap, Swap } from "../entities/swap.ts";
import { Context, nearestDay, SECONDS_PER_YEAR } from "./util.ts";
import { getToken } from "./tokens.ts";
import { Address } from "npm:viem";
import { PairSnapshot } from "../entities/pairSnapshot.ts";


const createOrUpdateSnapshot = async (ctx: Context, from: number, to: number, period: string) => {
	const pairs = await Pair.find({})
	return await Promise.all(pairs.map(async (pair: IPair) => {
		// Get previous snapshot
		const snapshot = await PairSnapshot.findOne({ pair, res: period, from }) || new PairSnapshot({
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

		// TODO - adjust when migrating to mainnet
		const aaveSnapshot0 = { liquidityRate: 0.02 } // (await AaveSnapshot.findOne({ token: pair.token0 }).sort({ timestamp: -1 }))!
		const aaveSnapshot1 = { liquidityRate: 0.02 } //(await AaveSnapshot.findOne({ token: pair.token1 }).sort({ timestamp: -1 }))!

		// hard-coding 30% managed -> TODO get the true managed amount
		const managed0 = Math.floor(pair.reserve0 * 0.3)
		const managed1 = Math.floor(pair.reserve1 * 0.3)
		const managedApy = 
			aaveSnapshot0.liquidityRate * (managed0 / pair.reserve0) + 
			aaveSnapshot1.liquidityRate * (managed1 / pair.reserve1)

		const token0 = await getToken(ctx.client, pair.token0 as Address)
		const volumeUSD = token0.priceUSD * volume0

		// Update the snapshot
		snapshot.totalSupply = 0 // TODO -> Get total supply of the LP token by monitoring mints/burns
		snapshot.reserve0 = pair.reserve0
		snapshot.reserve1 = pair.reserve1
		snapshot.managed0 = managed0
		snapshot.managed1 = managed1
		snapshot.fees0 = fees0
		snapshot.fees1 = fees1
		snapshot.swapApy = swapApy
		snapshot.volumeUSD = volumeUSD
		snapshot.managedApy = managedApy
		snapshot.managedRewardApy = 0 // TODO -> AAVE emissions
		snapshot.to = to
		return snapshot

	}))

}

const dailySnapshot = async (ctx: Context): Promise<void> => {
	const now = Number(ctx.block.timestamp)
	const nowDay = nearestDay(now)

	// Update the snapshot everytime, incase their have been trades
	const snapshots = await createOrUpdateSnapshot(ctx, nowDay, now, '1d')
	await PairSnapshot.bulkSave(snapshots)
}
	
export const SnapshotHandler: BlockHandler = async (ctx: Context): Promise<void> => {
	await dailySnapshot(ctx)
};