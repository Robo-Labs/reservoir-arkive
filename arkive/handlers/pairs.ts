import { type PublicClient, type Address } from "npm:viem";
import { ReservoirPairAbi } from "../abis/reservoirPair.ts";
import { Pair } from "../entities/pair.ts";
import { toNumber } from "./util.ts";
import { getToken } from "./tokens.ts";

export const getPair = async (client: PublicClient, address: Address) => {
  const record = await Pair.findOne({ address: address.toLowerCase() })
	if (!record) {
    throw Error('Cannot find pair ')
  }
  return record
}

export const createPair = async (client: PublicClient, address: Address, curveId: number) => {
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
	const rec = new Pair({ 
		address: address.toLowerCase(),
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

	await rec.save()
	return rec
}