import { getToken } from "../handlers/tokens.ts"
import { Swap } from "../entities/swap.ts";
import { Pair } from "../entities/pair.ts";
import { toNumber } from "../handlers/util.ts";
import { type PublicClient, type Address } from "npm:viem";
import oracle from "../abis/chainlink.ts"
import { FEED_MAP } from "../lib/feedMap.ts"

export class TokenPrice {
	static async get(client: PublicClient, block: bigint, token: Address) {
		const oraclePrice = await TokenPrice.getOraclePriceUSD(client, token, Number(block))
		if(oraclePrice > 0)
			return oraclePrice

		const swapPrice = await TokenPrice.getSwapPriceUSD(client, token, Number(block))
		if(swapPrice > 0)
			return swapPrice
		
		// throw new Error('Unable to fetch token price for this token ' + token)
		return 0
	}

	static async getOraclePriceUSD(client: PublicClient, tokenAddress: Address, block: number){
		const token = await getToken(client, tokenAddress)
		const CLFeedName = `${token.symbol} / USD`.toUpperCase()
		const feed = FEED_MAP.find(o => o.pair.toUpperCase() === CLFeedName && o.network == "Avalanche")
		if(feed !== undefined){
			const decimals = feed.decimals || 8
			let latestAnswer = await client.readContract({ abi: oracle, address: feed.address, functionName: "latestAnswer", blockNumber: BigInt(block) })
			return toNumber(latestAnswer, decimals)
		} else {
			return 0
		}
	}
	
	static async getSwapPriceUSD(client: PublicClient, token: Address, block: number){
		const pairRecord = await Pair.findOne({ token0: token }) || await Pair.findOne({ token1: token })
		if(!pairRecord)
			return 0

		const tokenIsZero = pairRecord.token0 == token

		const swapRecord = await Swap.findOne({pairAddress: pairRecord.address})
		if(!swapRecord) 
			return 0

		const getPriceTokenInAlt = () => {
			if (swapRecord.zeroForOne)
				return tokenIsZero ? swapRecord.amount0In / swapRecord.amount1Out : swapRecord.amount1Out / swapRecord.amount0In
			else
				return tokenIsZero ? swapRecord.amount1In / swapRecord.amount0Out : swapRecord.amount0Out / swapRecord.amount1In
		}

		const priceTokenInAlt = getPriceTokenInAlt()
		const altToken = tokenIsZero ? pairRecord.token1 : pairRecord.token0
		const altTokenOraclePrice = await TokenPrice.getOraclePriceUSD(client, altToken as Address, block)
		return Number(altTokenOraclePrice) * priceTokenInAlt
	}
}