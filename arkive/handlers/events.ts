import { EventHandlerFor } from "../deps.ts";
import { ReservoirPairAbi } from "../abis/reservoirPair.ts";
import { Swap } from "../entities/swap.ts";
import { getPair } from "./pairs.ts";
import { toNumber } from "./util.ts";


export const SwapHandler: EventHandlerFor<typeof ReservoirPairAbi, "Swap"> = async (
	{ event, client, store },
) => {
	const block = await store.retrieve(`getBlock:${event.blockNumber}`, async () => await client.getBlock({ blockNumber: event.blockNumber }))
	const { sender, zeroForOne, amountIn, amountOut, to } = event.args;
	const pair = await store.retrieve(`pair:${event.address}`, async () => await getPair(client, event.address))
	const rec = new Swap({
		block: Number(event.blockNumber),
		timestamp: Number(block.timestamp),
		pair,
		pairAddress: event.address,
		sender,
		to,
		zeroForOne,
		amount0In: toNumber(zeroForOne ? amountIn : 0n, pair.token0Decimals),
		amount1Out: toNumber(zeroForOne ? amountOut : 0n, pair.token1Decimals),
		amount1In: toNumber(zeroForOne ? 0n : amountIn, pair.token1Decimals),
		amount0Out: toNumber(zeroForOne ? 0n : amountOut, pair.token0Decimals),
	})
	await rec.save()
}

export const SyncHandler: EventHandlerFor<typeof ReservoirPairAbi, "Sync"> = async (
	{ event, client, store },
) => {
	const { reserve0, reserve1 } = event.args;
	const pair = await store.retrieve(`pair:${event.address}`, async () => await getPair(client, event.address))
	pair.reserve0 = toNumber(reserve0, pair.token0Decimals)
	pair.reserve1 = toNumber(reserve1, pair.token1Decimals)
	await pair.save()
}
