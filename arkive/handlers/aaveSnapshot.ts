import {
	type BlockHandler,
} from "https://deno.land/x/robo_arkiver@v0.4.15/mod.ts";
import { Context, nearestHour, nearestPeriod, toNumber } from "./util.ts";
import { AaveSnapshot } from "../entities/aaveSnapshot.ts";
import { Aave } from "./aavePools.ts";
import { AAVEPoolDataAbi } from "../abis/aavePoolData.ts";

const ONE_MINUTE = 60
const PERIOD = 10 * ONE_MINUTE;
	
export const AaveSnapshotHandler: BlockHandler = async (ctx: Context): Promise<void> => {
	console.log('aave snap!')
	const now = Number(ctx.block.timestamp)
	const nowPeriod = nearestPeriod(now, PERIOD)
	const last = await AaveSnapshot.findOne({}).sort({ timestamp: -1 })
	const lastHour = last?.timestamp ?? (nearestHour(now) - PERIOD)
	
	if (lastHour < nowPeriod) {
		const pools = await Aave.getPools(ctx.client, ctx.store, ctx.block.number!)
		const { poolData } = Aave.getPoolDataAddress(ctx.client)

		const records = await Promise.all(pools.map(async pool => {		  
			const [
				, // unbacked,
				, // accruedToTreasuryScaled,
				totalAToken,
				totalStableDebt, 
				totalVariableDebt,
				liquidityRate,
				variableBorrowRate,
				, // stableBorrowRate,
				, // averageStableBorrowRate,
				, // liquidityIndex,
				, // variableBorrowIndex,
				, // lastUpdateTimestamp,
			] = await ctx.client.readContract({
				address: poolData,
				abi: AAVEPoolDataAbi,
				functionName: 'getReserveData',
				args: [pool.underlying.address],
				blockNumber: ctx.block.number!,
			})

			return new AaveSnapshot({
				timestamp: nowPeriod,
				pool: pool,
				underlying: pool.underlying,
				underlyingAddress: pool.underlying.address,
				liquidityRate: toNumber(liquidityRate, 27),
				variableBorrowRate: toNumber(variableBorrowRate, 27),
				totalSupply: toNumber(totalAToken, pool.underlying.decimals),
				totalDebt: toNumber(totalStableDebt + totalVariableDebt, pool.underlying.decimals),
			})
		}))

		await AaveSnapshot.bulkSave(records)
	}
};