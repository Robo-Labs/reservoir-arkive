import {
	type BlockHandler,
} from "https://deno.land/x/robo_arkiver@v0.4.11/mod.ts";
import { IPair, Pair } from "../entities/pair.ts";
import { ISwap, Swap } from "../entities/swap.ts";
import { Context, nearestDay, SECONDS_PER_YEAR } from "./util.ts";
import { getToken } from "./tokens.ts";
import { Address } from "npm:viem";
import { PairSnapshot } from "../entities/pairSnapshot.ts";

const ONE_DAY = 60 * 60 * 24

const updateSnapshot = async (ctx: Context, now: number, period: string) => {
	const pairs = await Pair.find({})
	return await Promise.all(pairs.map(async (pair: IPair) => {
		// Get previous snapshot
		const from = now - ONE_DAY
		const swaps = await Swap.find({ pair, timestamp: { $gte: from } })

		// Calculate the stats for the snapshot
		const volume0 = swaps.reduce((acc: number, swap: ISwap) => acc += swap.amount0In + swap.amount0Out, 0)
		const volume1 = swaps.reduce((acc: number, swap: ISwap) => acc += swap.amount1In + swap.amount1Out, 0)
		const fees0 = volume0 * pair.swapFee
		const fees1 = volume1 * pair.swapFee
		const duration = now - from
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
		
		const snapshot = {
			res: period,
			pair,
			from,
			to: now,
			totalSupply: 0,
			reserve0: pair.reserve0,
			reserve1: pair.reserve1,
			managed0: managed0,
			managed1: managed1,
			fees0: fees0,
			fees1: fees1,
			volumeUSD: volumeUSD,
			swapApy: swapApy,
			managedApy: managedApy,
			managedRewardApy: 0 // TODO -> AAVE emissions
		}
		await PairSnapshot.findOneAndUpdate({ pair }, snapshot, { upsert: true })
	}))
}

const dailySnapshot = async (ctx: Context): Promise<void> => {
	const blocktime = Number(ctx.block.timestamp)
	const now = Math.floor(Date.now() / 1000) 

	// Update the snapshot everytime, incase their have been trades
	const timeSinceBlock = now - blocktime
	if (timeSinceBlock < 60)
		await updateSnapshot(ctx, blocktime, '1d')
}

export const SnapshotHandler: BlockHandler = async (ctx: Context): Promise<void> => {
	await dailySnapshot(ctx)
};