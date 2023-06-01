import {
	type BlockHandler,
} from "https://deno.land/x/robo_arkiver@v0.3.6/mod.ts";
import { IToken, Token } from "../entities/token.ts";
import { getToken } from "../handlers/tokens.ts"
import { ISwap, Swap } from "../entities/swap.ts";
import { Pair } from "../entities/pair.ts";
import { Context, toNumber } from "../handlers/util.ts";
import { type PublicClient, type Address } from "npm:viem";
import oracle from "../abis/chainlink.ts"
import feedMap from "../lib/feedMap.ts"

export class TokenPrice {

  static async getOraclePriceUSD(client: PublicClient, tokenAddress: string, block: number){
    let token = await getToken(client, tokenAddress)
    const CLFeedName = `${token.symbol} / USD`
    let feed = feedMap.find(o => o.Pair === CLFeedName && o.Network == "Fuji")
    if(feed !== undefined){
      let latestAnswer = await client.readContract({ abi: oracle, address: feed.Address, functionName: "latestAnswer", blockNumber: block })
      latestAnswer = toNumber(latestAnswer, 8)
      return latestAnswer
    } else {
      return 0
    }
  }
  
  static async getSwapPriceUSD(client: PublicClient, token: string, block: number){
    let tokenIsZero = true
    let pairRecord = await Pair.findOne({ token0: token })
    if(!pairRecord){
      pairRecord = await Pair.findOne({ token1: token })
      tokenIsZero = false
    }
    if(!pairRecord){
      return 0
    }
    const swapRecord = await Swap.findOne({pairAddress: pairRecord.address})
    let priceTokenInAlt = 0
    if(!swapRecord){
      return 0
    }
    if(swapRecord.zeroForOne){
      if(tokenIsZero){
        priceTokenInAlt = swapRecord.amount1Out /swapRecord.amount0In
      } else {
        priceTokenInAlt = swapRecord.amount0In / swapRecord.amount1Out
      }
    } else {
      if(tokenIsZero){
        priceTokenInAlt = swapRecord.amount1In / swapRecord.amount0Out
      } else {
        priceTokenInAlt = swapRecord.amount0Out / swapRecord.amount1In
      }
    }
    let altToken = tokenIsZero ? pairRecord.token1 : pairRecord.token0
    let altTokenOraclePrice = await TokenPrice.getOraclePriceUSD(client, altToken, block)
    return Number(altTokenOraclePrice)*priceTokenInAlt
  }

  
	static async get(client: PublicClient, block: bigint, token: Address) {
		const swapPrice = await TokenPrice.getSwapPriceUSD(client, token, Number(block))
    if(swapPrice > 0)
      return swapPrice
    const oraclePrice = await TokenPrice.getOraclePriceUSD(client, token, Number(block))
    if(oraclePrice > 0)
      return oraclePrice
    return 0
	}
}