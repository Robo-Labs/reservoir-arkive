import { IToken, Token } from "../entities/token.ts";
import { Context } from "./util.ts";
import { TokenPrice } from "../lib/tokenPrice.ts"
import { type PublicClient, type Address } from "npm:viem";
import erc20 from "../abis/erc20.ts";

export const getToken = async (client: PublicClient, address: Address) => {
	const network = client.chain!.name
	const token = await Token.findOne({ network, address })
	if (token)
		return token

	const [ symbol, decimals ] = await Promise.all([
		client.readContract({ abi: erc20, address: address, functionName: "symbol" }),
		client.readContract({ abi: erc20, address: address, functionName: "decimals" }),
	])
	const rec = new Token({
		network,
		address,
		symbol,
		decimals: Number(decimals),
		priceUSD: 0,
	})
	await rec.save()
	return rec as IToken
}

export const TokenHandler = async (ctx: Context): Promise<void> => {
	const network = ctx.client.chain!.name
	const tokens = await Token.find( { network })
	const records = await Promise.all(tokens.map(async (token: any) => {
		const key = `price:${token.address}:${ctx.block.number!}`
		const price = await ctx.store.retrieve(key, async () => await TokenPrice.get(ctx.client, ctx.block.number!, token.address as Address))
		token.priceUSD = price
		return token
	}))
	await Token.bulkSave(records)
};