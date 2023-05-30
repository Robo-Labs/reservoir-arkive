import {
	type BlockHandler,
} from "https://deno.land/x/robo_arkiver@v0.3.6/mod.ts";
import { IToken, Token } from "../entities/token.ts";
import { Context } from "./util.ts";
import { type PublicClient, type Address } from "npm:viem";
import erc20 from "../abis/erc20.ts";

export const getToken = async (client: PublicClient, address: Address) => {
	const token = await Token.findOne({ network: 'avalanche', address })
	if (token)
		return token

	const [ symbol, decimals ] = await Promise.all([
		client.readContract({ abi: erc20, address: address, functionName: "symbol" }),
		client.readContract({ abi: erc20, address: address, functionName: "decimals" }),
	])
	const rec = new Token({
		network: 'avalanche',
		address,
		symbol,
		decimals: Number(decimals),
		priceUSD: 0,
	})
	await rec.save()
	return rec as IToken
}

const updateTokenPrice = async (ctx: Context, token: IToken) => {
	// TODO update the token price

	// 1. Check if there's a CL oracle for the token

	// 2. If not, get the price from another onchain source like a dex
}

export const SnapshotHandler: BlockHandler = async (ctx: Context): Promise<void> => {
	const tokens = await Token.find( { network: 'avalanche' })
	await Promise.all(tokens.map(e => updateTokenPrice(ctx, e)))
};