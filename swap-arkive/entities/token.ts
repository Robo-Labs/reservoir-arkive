
import { createEntity } from "../deps.ts";

export interface IToken {
	network: string
	address: string
	symbol: string
	decimals: number
	priceUSD: number
}

export const Token = createEntity<IToken>("Token", {
	network: String,
	address: String,
	symbol: String,
	decimals: Number,
	priceUSD: Number,
})