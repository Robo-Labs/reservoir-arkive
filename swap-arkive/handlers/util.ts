import {
	type Store,
} from "https://deno.land/x/robo_arkiver@v0.4.11/mod.ts";
import { type Block } from "npm:viem";
import { type PublicClient } from "npm:viem";

export type Context = {
	block: Block;
	client: PublicClient;
	store: Store;
}

export const toNumber = (n: bigint, decimals: number = 0) => {
	return Number(n) / (10 ** decimals)
}


export const SECONDS_PER_YEAR = 60 * 60 * 24 * 365
export const HOUR = 60 * 60
export const DAY = 60 * 60 * 24

export const nearestHour = (now: number) => {
	return Math.floor(now / HOUR) * HOUR
}

export const nearestDay = (now: number) => {
	return Math.floor(now / DAY) * DAY
}

export const nearestPeriod = (now: number, period: number) => {
	return Math.floor(now / period) * period
}