import { type PublicClient, type Address } from "npm:viem";
import { Store } from "https://deno.land/x/robo_arkiver/mod.ts";
import { AAVEPoolAbi } from "../abis/aavePool.ts";
import { getToken } from "./tokens.ts";
import { AavePool } from "../entities/aavePool.ts";

// https://docs.aave.com/developers/deployed-contracts/v3-mainnet
// https://docs.aave.com/developers/deployed-contracts/v3-testnet-addresses
export const AavePoolLu: {[key: string]: Address } = {
	'ethereum': '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
	'optimism': '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
	'avalanche': '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
	'avalanche fuji': '0xf319Bb55994dD1211bC34A7A26A336C6DD0B1b00',
}
export const AaveDataPoolLu: {[key: string]: Address } = {
	'ethereum': '0x',
	'optimism': '0x',
	'avalanche': '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
	'avalanche fuji': '0x0B59871DF373136bB7753A7A2675b47ffA0ccC86',
}

export class Aave {
	static async getPools(client: PublicClient, store: Store, block: bigint) {
			const {pool, network} = Aave.getPoolAddress(client)
		
			return await store.retrieve(`${network}:AAVE Pools`, async () => {
				const records = await AavePool.find({ network }).populate('underlying')
				if (records.length > 0)
					return records
		
				// Otherwise populate the array offchain
				const poolAddresses = await client.readContract({
					address: pool,
					abi: AAVEPoolAbi,
					functionName: 'getReservesList',
					blockNumber: block,
				})
		
				const pools = await Promise.all(poolAddresses.map(async (address: Address) => { 
					const token = await getToken(client, address)
					return new AavePool({
						protocol: 'AAVE',
						address,
						network,
						underlyingSymbol: token.symbol,
						underlying: token
					})
				}))
				AavePool.bulkSave(pools)
				return pools
			})
		}

	static getPoolAddress(client: PublicClient) {
		if (!client.chain)
			throw new Error('Chain must be specified')
		const network = client.chain.name.toLocaleLowerCase()
		const pool = AavePoolLu[network]
		if (!pool)
			throw new Error('Unknown Pool for network: ' + network)
		return { pool, network }
	}

	static getPoolDataAddress(client: PublicClient) {
		if (!client.chain)
			throw new Error('Chain must be specified')
		const network = client.chain.name.toLocaleLowerCase()
		const poolData = AaveDataPoolLu[network]
		if (!poolData)
			throw new Error('Unknown Pool for network: ' + network)
		return {poolData, network}
	}
}