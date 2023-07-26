import { type PublicClient, type Address } from "npm:viem";
import { ReservoirPairAbi } from "../abis/reservoirPair.ts";
import { Pair } from "../entities/pair.ts";
import { toNumber } from "./util.ts";
import { getToken } from "./tokens.ts";

const CURVE_IDS: Record<string, number>= {
  '0x1e93509a80e936bff8e27c129a9b99728a51d0cc': 0,
  '0x146d00567cef404c1c0aaf1dfd2abea9f260b8c7': 1,
  '0x02ee8b06c500d0dddb8c689efdf24971ceb0ef19': 0,
  '0x81e50d088987e8f96a7c5f909c5665cd267eec82': 1,
}

export const getPair = async (client: PublicClient, address: Address) => {
	const record = await Pair.findOne({ address })
	if (record)
		return record

	const abi = ReservoirPairAbi
	const [ token0Address, token1Address, swapFee, reserves ] = await Promise.all([
		client.readContract({ abi, address, functionName: "token0" }),
		client.readContract({ abi, address, functionName: "token1" }),
		client.readContract({ abi, address, functionName: "swapFee" }),
		client.readContract({ abi, address, functionName: "getReserves" }),
	])
	const [token0, token1] = await Promise.all([
		getToken(client, token0Address),
		getToken(client, token1Address),
	])
  const id = CURVE_IDS[address.toLowerCase()]
  const curveId = id !== undefined ? id : 99
	const rec = new Pair({ 
		address,
		curveId,
		swapFee: toNumber(swapFee, 6),
		token0: token0Address,
		token1: token1Address,
		token0Decimals: token0.decimals,
		token1Decimals: token1.decimals,
		token0Symbol: token0.symbol,
		token1Symbol: token1.symbol,
		reserve0: toNumber(reserves[0], token0.decimals),
		reserve1: toNumber(reserves[1], token1.decimals),
		tvlUSD: (toNumber(reserves[0], token0.decimals)*token0.priceUSD) + (toNumber(reserves[1], token1.decimals) * token1.priceUSD)
	})

	await Promise.all([
		rec.save(),
	])
	return rec
}