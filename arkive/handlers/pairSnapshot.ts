import {
	type BlockHandler,
} from "https://deno.land/x/robo_arkiver@v0.4.15/mod.ts";
import { IPair, Pair } from "../entities/pair.ts";
import { ISwap, Swap } from "../entities/swap.ts";
import { Context, nearestDay, SECONDS_PER_YEAR, toNumber } from "./util.ts";
import { getToken } from "./tokens.ts";
import { Address } from "npm:viem";
import { PairSnapshot } from "../entities/pairSnapshot.ts";
import { AaveSnapshot } from "../entities/aaveSnapshot.ts";
import { AaveAssetManagerAbi } from "../abis/aaveAssetManager.ts";

const ONE_DAY = 60 * 60 * 24

const ASSET_MANAGER = '0xbe8A6DDDA2D2AA6BC88972801Be1119BD228f55e'

const updateSnapshot = async (ctx: Context, now: number, period: string) => {
	const pairs = await Pair.find({})
	return await Promise.all(pairs.map(async (pair) => {
		// Get previous snapshot
		const from = now - ONE_DAY
		const swaps = await Swap.find({ pair, timestamp: { $gte: from } })
		const { client } = ctx

		// Calculate the stats for the snapshot
		const volume0 = swaps.reduce((acc: number, swap: ISwap) => acc += swap.amount0In + swap.amount0Out, 0)
		const volume1 = swaps.reduce((acc: number, swap: ISwap) => acc += swap.amount1In + swap.amount1Out, 0)
		const fees0 = volume0 * pair.swapFee
		const fees1 = volume1 * pair.swapFee
		const duration = now - from
		const returns = fees0 / pair.reserve0
		const swapApy = (returns / duration) * SECONDS_PER_YEAR
		const [ aaveSnapshot0, aaveSnapshot1 ] = await Promise.all([
			AaveSnapshot.findOne({ underlyingAddress: pair.token0 }).sort({ timestamp: -1 }),
			AaveSnapshot.findOne({ underlyingAddress: pair.token1 }).sort({ timestamp: -1 })
		])
		
		const liquidityRate0 = aaveSnapshot0?.liquidityRate || 0
		const liquidityRate1 = aaveSnapshot1?.liquidityRate || 0

		const managed = await client.multicall({
			contracts: [
				{ abi: AaveAssetManagerAbi, address: ASSET_MANAGER, functionName: 'getBalance', args: [pair.address as Address, pair.token0 as Address] },
				{ abi: AaveAssetManagerAbi, address: ASSET_MANAGER, functionName: 'getBalance', args: [pair.address as Address, pair.token1 as Address] },
			],
			blockNumber: ctx.block.number!
		})

		// hard-coding 30% managed -> TODO get the true managed amount
		const managed0 = toNumber(managed[0].result!, pair.token0Decimals)
		const managed1 = toNumber(managed[1].result!, pair.token1Decimals)
		const managedApy =
			liquidityRate0 * (managed0 / pair.reserve0) + 
			liquidityRate1 * (managed1 / pair.reserve1)

		const token0 = await getToken(ctx.client, pair.token0 as Address)
		const token1 = await getToken(ctx.client, pair.token0 as Address)
		const volumeUSD = token0.priceUSD * volume0
		
		const snapshot = {
			res: period,
			pair,
			from,
			to: now,
			totalSupply: 0,
			reserve0: pair.reserve0,
			reserve1: pair.reserve1,
			managed0,
			managed1,
			fees0: fees0,
			fees1: fees1,
			volumeUSD: volumeUSD,
			swapApy: swapApy,
			managedApy: managedApy,
			managedRewardApy: 0 // TODO -> AAVE emissions
		}
		await PairSnapshot.findOneAndUpdate({ pair }, snapshot, { upsert: true })

		// update pair.tvlUSD
		pair.tvlUSD = pair.reserve0 * token0.priceUSD + pair.reserve1 * token1.priceUSD
		await pair.save()
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