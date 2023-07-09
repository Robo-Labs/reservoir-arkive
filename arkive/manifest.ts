import { Manifest } from "https://deno.land/x/robo_arkiver@v0.4.11/mod.ts"
import { ReservoirPairAbi } from './abis/reservoirPair.ts'
import { Pair } from './entities/pair.ts'
import { Swap } from './entities/swap.ts'
import { Token } from './entities/token.ts'
import { TokenHandler } from './handlers/tokens.ts'
import { SwapHandler, SyncHandler } from './handlers/events.ts'
import { AaveSnapshotHandler } from './handlers/aaveSnapshot.ts'
import { AaveSnapshot } from './entities/aaveSnapshot.ts'
import { SnapshotHandler } from './handlers/pairSnapshot.ts'
import { PairSnapshot } from './entities/pairSnapshot.ts'

const manifest = new Manifest('reservoir-mainnet')
const startBlockHeight = 31569814n
const avalanche = manifest
	.addEntities([Swap, Pair, Token, PairSnapshot, AaveSnapshot])
	.chain('avalanche', { blockRange: 2000n })

avalanche
	.contract(ReservoirPairAbi)
	.addSources({
		'0x146D00567Cef404c1c0aAF1dfD2abEa9F260B8C7': 31569814n,
		'0x1e93509A80E936BfF8e27C129a9B99728A51D0cC': 31616100n,
	})
	.addEventHandlers({ 'Swap': SwapHandler })
	.addEventHandlers({ 'Sync': SyncHandler })

// Snapshots
avalanche
	.addBlockHandler({ blockInterval: 20, startBlockHeight: 'live', handler: SnapshotHandler })

// Price Updates
avalanche
	.addBlockHandler({ blockInterval: 20, startBlockHeight: 'live', handler: TokenHandler })

// Aave Updates
avalanche
	.addBlockHandler({ blockInterval: 20, startBlockHeight: 'live', handler: AaveSnapshotHandler })

export default manifest.build()