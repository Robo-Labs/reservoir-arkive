import {
	type BlockHandler,
} from "https://deno.land/x/robo_arkiver@v0.3.6/mod.ts";
import { IToken, Token } from "../entities/token.ts";
import { Context } from "./util.ts";
import { TokenPrice } from "../lib/tokenPrice.ts"
import { type PublicClient, type Address } from "npm:viem";
import erc20 from "../abis/erc20.ts";
//import { pairRecordHelperArgs } from "../../../../.cache/deno/npm/registry.npmjs.org/graphql-compose-mongoose/9.8.0/lib/resolvers/helpers/pairRecord.d.ts";

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
	// const native = '0x1D308089a2D1Ced3f1Ce36B1FcaF815b07217be3'
	// const nativeSymbol = "WAVAX"
	const price = await TokenPrice.get(ctx.client, Number(ctx.block.number), token.address)
	token.priceUSD = price
	await token.save()
}

export const TokenHandler: BlockHandler = async (ctx: Context): Promise<void> => {
	const tokens = await Token.find( { network: 'avalanche' })
	await Promise.all(tokens.map(e => updateTokenPrice(ctx, e)))
};