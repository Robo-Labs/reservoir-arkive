import { createEntity } from "https://deno.land/x/robo_arkiver/mod.ts";

export interface IPair {
	address: string,
	swapFee: number,
	token0: string,
	token1: string,
	token0Decimals: number,
	token1Decimals: number,
	token0Symbol: string,
	token1Symbol: string,
	reserve0: number,
	reserve1: number,
	tvlUSD: number,
}

export const Pair = createEntity<IPair>("Pair", {
	address: String,
	swapFee: Number,
	token0: String,
	token1: String,
	token0Decimals: Number,
	token1Decimals: Number,
	token0Symbol: String,
	token1Symbol: String,
	reserve0: Number,
	reserve1: Number,
	tvlUSD: Number,
});

