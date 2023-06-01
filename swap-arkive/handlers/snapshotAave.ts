import {
	type BlockHandler,
} from "https://deno.land/x/robo_arkiver@v0.3.6/mod.ts";
import aavePool from "../abis/aavePool.ts"
import { SnapshotAave } from "../entities/snapshotAave.ts";
import { Pair } from "../entities/pair.ts";
import { ISwap, Swap } from "../entities/swap.ts";
import { IToken, Token } from "../entities/token.ts";
import { Context, nearestHour, SECONDS_PER_YEAR } from "./util.ts";

const getAaveApyToken = async (client: PublicClient, token: string, block: number) => {
	const AAVE_POOL = '0xf319Bb55994dD1211bC34A7A26A336C6DD0B1b00'
	let tempTokenMap = {'0x5D60473C5Cb323032d6fdFf42380B50E2AE4d245': '0x6a17716Ce178e84835cfA73AbdB71cb455032456', '0x6e9FDaE1Fe20b0A5a605C879Ae14030a0aE99cF9':'0x0343A9099f42868C1E8Ae9e501Abc043FD5fD816' }
	let realToken = tempTokenMap[token]
	let reserveData = await client.readContract({
				args: [realToken],
				abi: aavePool,
				functionName: "getReserveData",
				address: AAVE_POOL,
				blockNumber: block
			})
	let aaveSupplyToken = Number(reserveData['currentLiquidityRate'])
	const RAY = 10**27
	return aaveSupplyToken/RAY
}
const createSnapshot = async (ctx: Context, from: number, to: number, period: string) => {
	const tokens = await Token.find({})
	return await Promise.all(tokens.map(async (token: IToken) => {
		// Get previous snapshot
		const snapshot = await SnapshotAave.findOne({ token: token.address, res: period, from }) || new SnapshotAave({
			res: period,
			from,
			to,
			token: token.address,
			feeApy: 0,
		}) as any
		let apy = await getAaveApyToken(ctx.client, token.address, Number(ctx.block.number))
		snapshot.apy = apy
		return snapshot
	}))

}

const dailySnapshot = async (ctx: Context): Promise<void> => {
	const now = Number(ctx.block.timestamp)
	const nowHour = nearestHour(now)

	// Update the snapshot everytime, incase their have been trades
	const snapshots = await createSnapshot(ctx, nowHour, now, '1h')
	await SnapshotAave.bulkSave(snapshots)
}
	
export const SnapshotAaveHandler: BlockHandler = async (ctx: Context): Promise<void> => {
	console.log('SnapshotAaveHandler', ctx.block.number, Number(ctx.block.timestamp))
	await dailySnapshot(ctx)
};